import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { encrypt } from '../utils/encryption';
import { generateCaseId } from '../utils/caseId';
import { logAudit } from '../services/audit';

const prisma = new PrismaClient();

const publicBookingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10).max(15),
  aadhaar: z.string().length(12).optional().or(z.literal('')),
  address: z.string().optional(),
  stateId: z.string().optional(),
  districtId: z.string().optional(),
  purpose: z.string().min(10, 'Please describe your request in detail'),
  preferredDate: z.string().optional(),
});

export default async function publicRoutes(fastify: FastifyInstance) {
  // Public: Get states list
  fastify.get('/public/states', async (_request, reply) => {
    const states = await prisma.state.findMany({ orderBy: { name: 'asc' } });
    return reply.send(states);
  });

  // Public: Get districts by state
  fastify.get('/public/districts', async (request, reply) => {
    const { stateId } = request.query as any;
    const where: any = {};
    if (stateId) where.stateId = stateId;
    const districts = await prisma.district.findMany({ where, orderBy: { name: 'asc' } });
    return reply.send(districts);
  });

  // Public: Submit an appointment/booking
  fastify.post('/public/book', async (request, reply) => {
    try {
      const data = publicBookingSchema.parse(request.body);

      // Find or create citizen
      let citizen = await prisma.citizen.findUnique({ where: { phone: data.phone } });
      if (!citizen) {
        citizen = await prisma.citizen.create({
          data: {
            name: data.name,
            phone: data.phone,
            aadhaar: data.aadhaar ? encrypt(data.aadhaar) : undefined,
            address: data.address,
            districtId: data.districtId || undefined,
            stateId: data.stateId || undefined,
          }
        });
      }

      // Create a case
      const caseIdString = await generateCaseId();
      const newCase = await prisma.case.create({
        data: {
          caseId: caseIdString,
          citizenId: citizen.id,
          purpose: data.purpose,
          meetingDate: data.preferredDate ? new Date(data.preferredDate) : null,
          status: 'PENDING',
          priority: 'MEDIUM',
        }
      });

      await logAudit('PUBLIC_BOOKING', { citizenId: citizen.id, phone: data.phone }, newCase.id);

      return reply.send({
        success: true,
        caseId: newCase.caseId,
        message: `Your appointment request has been registered with Case ID: ${newCase.caseId}. You can track your status using this ID.`
      });
    } catch (err: any) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: err.errors || err.message
      });
    }
  });

  // Public: Track case status by caseId or phone
  fastify.get('/public/track', async (request, reply) => {
    const { query } = request.query as any;
    if (!query) return reply.status(400).send({ error: 'Please provide a Case ID or Phone Number' });

    const cases = await prisma.case.findMany({
      where: {
        OR: [
          { caseId: { contains: query } },
          { citizen: { phone: { contains: query } } }
        ]
      },
      include: {
        citizen: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return reply.send(cases);
  });
}

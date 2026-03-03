import { FastifyInstance } from 'fastify';
import prisma from '../data/prisma';
import { z } from 'zod';
import { encrypt } from '../utils/encryption';
import { generateCaseId } from '../utils/caseId';
import { logAudit } from '../services/audit';
import { handleError } from '../utils/errors';
import { StateQuery, TrackQuery } from '../types/fastify';

const requestCategoryEnum = z.enum([
  'PUBLIC_GRIEVANCE', 'POLICY_REQUEST', 'PERSONAL_ISSUE', 'LAND_AND_REVENUE',
  'CIVIC_ISSUE', 'PENSION_AND_WELFARE', 'OTHER',
]);

const publicBookingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10).max(15),
  aadhaar: z.string().length(12).optional().or(z.literal('')),
  address: z.string().optional(),
  stateId: z.string().optional(),
  districtId: z.string().optional(),
  purpose: z.string().min(10, 'Please describe your request in detail'),
  preferredDate: z.string().optional(),
  category: requestCategoryEnum.optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

export default async function publicRoutes(fastify: FastifyInstance) {
  // Public: Get states list (used in booking form)
  fastify.get('/public/states', async (_request, reply) => {
    try {
      const states = await prisma.state.findMany({ orderBy: { name: 'asc' } });
      return reply.send(states);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // Public: Get districts by state (used in booking form)
  fastify.get('/public/districts', async (request, reply) => {
    try {
      const { stateId } = request.query as StateQuery;
      const where = stateId ? { stateId } : {};
      const districts = await prisma.district.findMany({ where, orderBy: { name: 'asc' } });
      return reply.send(districts);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // Public: Submit an appointment/booking (with transaction + retry for caseId race condition)
  // Rate limited to 5 submissions per hour per IP to prevent bot flooding
  fastify.post('/public/book', {
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    try {
      const data = publicBookingSchema.parse(request.body);

      let newCase;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          newCase = await prisma.$transaction(async (tx) => {
            let citizen = await tx.citizen.findUnique({ where: { phone: data.phone } });
            if (!citizen) {
              citizen = await tx.citizen.create({
                data: {
                  name: data.name,
                  phone: data.phone,
                  aadhaar: data.aadhaar ? encrypt(data.aadhaar) : undefined,
                  address: data.address,
                  districtId: data.districtId || undefined,
                  stateId: data.stateId || undefined,
                },
              });
            }

            const caseIdString = await generateCaseId(tx);
            const created = await tx.case.create({
              data: {
                caseId: caseIdString,
                citizenId: citizen.id,
                purpose: data.purpose,
                meetingDate: data.preferredDate ? new Date(data.preferredDate) : null,
                status: 'PENDING_APPROVAL',
                priority: data.priority ?? 'MEDIUM',
                category: data.category ?? undefined,
              },
            });

            await logAudit('PUBLIC_BOOKING', { citizenId: citizen.id, phone: data.phone }, created.id, undefined, tx);
            return created;
          });
          break;
        } catch (txErr: unknown) {
          const prismaErr = txErr as { code?: string };
          if (prismaErr?.code === 'P2002' && attempt < 2) continue;
          throw txErr;
        }
      }

      return reply.send({
        success: true,
        caseId: newCase!.caseId,
        message: `Your appointment request has been registered with Case ID: ${newCase!.caseId}. You can track your status using this ID.`,
      });
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // Public: Track case status by exact caseId only.
  // Phone-based search is intentionally NOT supported here to prevent
  // unauthenticated enumeration of all cases belonging to a phone number.
  fastify.get('/public/track', {
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    try {
      const { query } = request.query as TrackQuery;
      if (!query) return reply.status(400).send({ error: 'Please provide a Case ID', code: 'MISSING_QUERY' });

      // Guard: reject queries that are too long or don't look like a case ID
      const trimmed = query.trim();
      if (trimmed.length > 30) {
        return reply.status(400).send({ error: 'Invalid Case ID format', code: 'INVALID_QUERY' });
      }

      const found = await prisma.case.findFirst({
        where: { caseId: trimmed },
        // Only return citizen-safe fields — never expose internal IDs, notes, or staff data
        select: {
          caseId: true,
          status: true,
          purpose: true,
          category: true,
          priority: true,
          createdAt: true,
          scheduledDate: true,
          scheduledTimeSlot: true,
          meetingType: true,
          venueOrLink: true,
          closureStatus: true,
          citizen: { select: { name: true } },
        },
      });

      if (!found) {
        return reply.status(404).send({ error: 'Case not found', code: 'NOT_FOUND' });
      }

      return reply.send(found);
    } catch (err) {
      return handleError(err, reply);
    }
  });
}

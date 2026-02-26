import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createCitizenSchema } from '../utils/validation';
import { encrypt, decrypt } from '../utils/encryption';
import { logAudit } from '../services/audit';

const prisma = new PrismaClient();

export default async function citizenRoutes(fastify: FastifyInstance) {
  fastify.post('/citizens', {
    preValidation: [async (request, reply) => {
      try { await request.jwtVerify() } catch (err) { reply.send(err) }
    }]
  }, async (request, reply) => {
    try {
      const data = createCitizenSchema.parse(request.body);
      const user = (request.user as any);

      // Check if citizen exists by phone
      let citizen = await prisma.citizen.findUnique({
        where: { phone: data.phone }
      });

      if (!citizen) {
        // Create new citizen
        citizen = await prisma.citizen.create({
          data: {
            name: data.name,
            phone: data.phone,
            aadhaar: data.aadhaar ? encrypt(data.aadhaar) : undefined,
            address: data.address,
            districtId: data.districtId,
            stateId: data.stateId
          }
        });
        await logAudit('CITIZEN_CREATED', { citizenId: citizen.id }, undefined, user.id);
      }

      return reply.send(citizen);
    } catch (err: any) {
      console.log(err);
      return reply.status(400).send({ error: 'Validation failed or duplicate phone', details: err.errors });
    }
  });

  fastify.get('/citizens', {
    preValidation: [async (request, reply) => {
      try { await request.jwtVerify() } catch (err) { reply.send(err) }
    }]
  }, async (request, reply) => {
    const { search } = request.query as any;
    
    let whereClause = {};
    if (search) {
      whereClause = {
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } }
        ]
      };
    }
    
    const citizens = await prisma.citizen.findMany({
      where: whereClause,
      take: 20
    });
    
    return reply.send(citizens);
  });
}

import { FastifyInstance } from 'fastify';
import prisma from '../data/prisma';
import { createCitizenSchema } from '../utils/validation';
import { encrypt } from '../utils/encryption';
import { logAudit } from '../services/audit';
import { authenticate } from '../middleware/authenticate';
import { handleError } from '../utils/errors';
import { CitizenQuery } from '../types/fastify';

export default async function citizenRoutes(fastify: FastifyInstance) {
  fastify.post('/citizens', {
    preValidation: [authenticate],
  }, async (request, reply) => {
    try {
      const data = createCitizenSchema.parse(request.body);
      const user = request.user;

      let citizen = await prisma.citizen.findUnique({ where: { phone: data.phone } });

      if (!citizen) {
        citizen = await prisma.citizen.create({
          data: {
            name: data.name,
            phone: data.phone,
            aadhaar: data.aadhaar ? encrypt(data.aadhaar) : undefined,
            address: data.address,
            districtId: data.districtId,
            stateId: data.stateId,
          },
        });
        await logAudit('CITIZEN_CREATED', { citizenId: citizen.id }, undefined, user.id);
      }

      return reply.send(citizen);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  fastify.get('/citizens', {
    preValidation: [authenticate],
  }, async (request, reply) => {
    try {
      const { search, page = '1', limit = '20' } = request.query as CitizenQuery;

      const whereClause = search
        ? { OR: [{ name: { contains: search } }, { phone: { contains: search } }] }
        : {};

      const skip = (Number(page) - 1) * Number(limit);

      const [citizens, total] = await Promise.all([
        prisma.citizen.findMany({ where: whereClause, skip, take: Number(limit) }),
        prisma.citizen.count({ where: whereClause }),
      ]);

      return reply.send({
        data: citizens,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (err) {
      return handleError(err, reply);
    }
  });
}

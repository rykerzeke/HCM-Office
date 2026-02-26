import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function referenceRoutes(fastify: FastifyInstance) {
  fastify.get('/states', async (request, reply) => {
    const states = await prisma.state.findMany({ orderBy: { name: 'asc' } });
    return reply.send(states);
  });

  fastify.get('/districts', async (request, reply) => {
    const { stateId } = request.query as any;
    let whereClause = {};
    if (stateId) whereClause = { stateId };
    
    const districts = await prisma.district.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });
    return reply.send(districts);
  });

  fastify.get('/officials', async (request, reply) => {
    const { stateId, districtId, search } = request.query as any;
    
    let whereClause: any = {};
    if (stateId) whereClause.stateId = stateId;
    if (districtId) whereClause.districtId = districtId;
    if (search) {
      whereClause.name = { contains: search };
    }

    const officials = await prisma.official.findMany({
      where: whereClause,
      include: { state: true, district: true },
      orderBy: { name: 'asc' }
    });
    return reply.send(officials);
  });
}

import { FastifyInstance } from 'fastify';
import prisma from '../data/prisma';
import { authenticate } from '../middleware/authenticate';

export default async function auditRoutes(fastify: FastifyInstance) {
  fastify.get('/audit', {
    preValidation: [authenticate]
  }, async (request, reply) => {
    const { caseId, limit = 50 } = request.query as any;
    
    let whereClause = {};
    if (caseId) whereClause = { caseId };

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, role: true } },
        case: { select: { caseId: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    });

    return reply.send(logs);
  });
}

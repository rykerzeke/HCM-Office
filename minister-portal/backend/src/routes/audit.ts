import { FastifyInstance } from 'fastify';
import prisma from '../data/prisma';
import { authenticate } from '../middleware/authenticate';
import { requireStaffOrAdmin } from '../middleware/authorize';
import { handleError } from '../utils/errors';
import { AuditQuery } from '../types/fastify';

export default async function auditRoutes(fastify: FastifyInstance) {
  // Staff + Admin only — Officials should not browse the full audit trail
  fastify.get('/audit', {
    preValidation: [authenticate, requireStaffOrAdmin],
  }, async (request, reply) => {
    try {
      const { caseId, limit = '50' } = request.query as AuditQuery;

      const whereClause = caseId ? { caseId } : {};

      const logs = await prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: { select: { name: true, role: true } },
          case: { select: { caseId: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
      });

      return reply.send(logs);
    } catch (err) {
      return handleError(err, reply);
    }
  });
}

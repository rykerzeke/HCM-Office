import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/dashboard/stats', {
    preValidation: [async (request, reply) => {
      try { await request.jwtVerify() } catch (err) { reply.send(err) }
    }]
  }, async (request, reply) => {
    const totalRequests = await prisma.case.count();
    const pendingTasks = await prisma.case.count({ where: { status: 'PENDING' } });
    const completedTasks = await prisma.case.count({ where: { status: 'COMPLETED' } });
    const escalations = await prisma.case.count({ where: { status: 'ESCALATED' } });

    const recentUpdates = await prisma.auditLog.findMany({
      where: {
        action: { in: ['STATUS_CHANGED', 'CASE_CREATED', 'CASE_ASSIGNED', 'COMMENT_ADDED'] }
      },
      include: { case: { select: { caseId: true } }, user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return reply.send({
      stats: { totalRequests, pendingTasks, completedTasks, escalations },
      recentUpdates
    });
  });
}

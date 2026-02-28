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
    const pendingApproval = await prisma.case.count({ where: { status: 'PENDING_APPROVAL' } });
    const onHold = await prisma.case.count({ where: { status: 'ON_HOLD' } });
    const pendingTasks = pendingApproval + onHold;
    const completedTasks = await prisma.case.count({ where: { status: { in: ['COMPLETED', 'CLOSED'] } } });
    const followUpRequired = await prisma.case.count({ where: { status: { in: ['FOLLOW_UP_REQUIRED', 'RESCHEDULE_REQUIRED'] } } });
    const highPriority = await prisma.case.count({ where: { priority: { in: ['HIGH', 'URGENT'] }, status: { notIn: ['CLOSED', 'REJECTED'] } } });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const upcomingMeetings = await prisma.case.findMany({
      where: { status: 'SCHEDULED', scheduledDate: { gte: todayStart } },
      include: { citizen: { select: { name: true, phone: true } } },
      orderBy: { scheduledDate: 'asc' },
      take: 10
    });

    const recentUpdates = await prisma.auditLog.findMany({
      where: {
        action: { in: ['CASE_CREATED', 'CASE_APPROVE', 'CASE_REJECT', 'CASE_SCHEDULED', 'CASE_CLOSED', 'CASE_ASSIGNED', 'COMMENT_ADDED'] }
      },
      include: { case: { select: { caseId: true } }, user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return reply.send({
      stats: {
        totalRequests,
        pendingTasks,
        completedTasks,
        followUpRequired,
        highPriority,
        pendingApproval,
        onHold,
      },
      upcomingMeetings,
      recentUpdates
    });
  });
}

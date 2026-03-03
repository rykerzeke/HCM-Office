import { FastifyInstance } from 'fastify';
import prisma from '../data/prisma';
import { authenticate } from '../middleware/authenticate';
import { handleError } from '../utils/errors';

// ---------------------------------------------------------------------------
// Simple in-memory cache — avoids 8 full-table-scan queries on every page
// load under concurrent usage. 30-second TTL is short enough to stay fresh.
// ---------------------------------------------------------------------------
let statsCache: { data: unknown; expiresAt: number } | null = null;
const STATS_TTL_MS = 30_000;

export default async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/dashboard/stats', {
    preValidation: [authenticate],
  }, async (_request, reply) => {
    try {
      // Return cached payload if still fresh
      if (statsCache && Date.now() < statsCache.expiresAt) {
        return reply.send(statsCache.data);
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Run all count queries in parallel instead of sequentially
      const [
        totalRequests,
        pendingApproval,
        onHold,
        completedTasks,
        followUpRequired,
        highPriority,
        upcomingMeetings,
        recentUpdates,
      ] = await Promise.all([
        prisma.case.count(),
        prisma.case.count({ where: { status: 'PENDING_APPROVAL' } }),
        prisma.case.count({ where: { status: 'ON_HOLD' } }),
        prisma.case.count({ where: { status: { in: ['COMPLETED', 'CLOSED'] } } }),
        prisma.case.count({ where: { status: { in: ['FOLLOW_UP_REQUIRED', 'RESCHEDULE_REQUIRED'] } } }),
        prisma.case.count({ where: { priority: { in: ['HIGH', 'URGENT'] }, status: { notIn: ['CLOSED', 'REJECTED'] } } }),
        prisma.case.findMany({
          where: { status: 'SCHEDULED', scheduledDate: { gte: todayStart } },
          include: { citizen: { select: { name: true, phone: true } } },
          orderBy: { scheduledDate: 'asc' },
          take: 10,
        }),
        prisma.auditLog.findMany({
          where: {
            action: { in: ['CASE_CREATED', 'CASE_APPROVE', 'CASE_REJECT', 'CASE_SCHEDULED', 'CASE_CLOSED', 'CASE_ASSIGNED', 'COMMENT_ADDED'] },
          },
          include: { case: { select: { caseId: true } }, user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

      const payload = {
        stats: {
          totalRequests,
          pendingTasks: pendingApproval + onHold,
          completedTasks,
          followUpRequired,
          highPriority,
          pendingApproval,
          onHold,
        },
        upcomingMeetings,
        recentUpdates,
      };

      // Store in cache
      statsCache = { data: payload, expiresAt: Date.now() + STATS_TTL_MS };

      return reply.send(payload);
    } catch (err) {
      return handleError(err, reply);
    }
  });
}

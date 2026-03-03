import { FastifyInstance } from 'fastify';
import prisma from '../data/prisma';
import { createCaseSchema, approveRejectSchema, scheduleMeetingSchema, visitCheckInSchema, closeMeetingSchema } from '../utils/validation';
import { generateCaseId } from '../utils/caseId';
import { logAudit } from '../services/audit';
import { authenticate } from '../middleware/authenticate';
import { handleError } from '../utils/errors';
import { IdParam, PaginationQuery } from '../types/fastify';

const auth = [authenticate];

export default async function caseRoutes(fastify: FastifyInstance) {
  // 1. Request submission
  fastify.post('/cases', { preValidation: auth }, async (request, reply) => {
    try {
      const data = createCaseSchema.parse(request.body);
      const user = request.user;

      // Transaction: generateCaseId + create case atomically to prevent duplicate IDs
      let newCase;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          newCase = await prisma.$transaction(async (tx) => {
            const caseIdString = await generateCaseId(tx);
            return tx.case.create({
              data: {
                caseId: caseIdString,
                citizenId: data.citizenId,
                purpose: data.purpose,
                meetingDate: data.meetingDate ? new Date(data.meetingDate) : null,
                status: 'PENDING_APPROVAL',
                priority: data.priority || 'MEDIUM',
                category: data.category || undefined,
                referringOfficer: data.referringOfficer,
                referenceMode: data.referenceMode,
                supportingNotePath: data.supportingNotePath || undefined,
              },
            });
          });
          break;
        } catch (txErr: unknown) {
          const prismaErr = txErr as { code?: string };
          if (prismaErr?.code === 'P2002' && attempt < 2) continue;
          throw txErr;
        }
      }

      await logAudit('CASE_CREATED', { caseId: newCase!.caseId }, newCase!.id, user.id);
      return reply.send(newCase);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // 2. List cases with pagination, search, and filters
  fastify.get('/cases', { preValidation: auth }, async (request, reply) => {
    try {
      const { page = '1', limit = '10', search, status, priority, category } = request.query as PaginationQuery;

      const skip = (Number(page) - 1) * Number(limit);
      const whereClause: Record<string, unknown> = {};

      if (search) {
        whereClause.OR = [
          { caseId: { contains: search } },
          { citizen: { name: { contains: search } } },
          { citizen: { phone: { contains: search } } },
        ];
      }
      if (status) whereClause.status = status;
      if (priority) whereClause.priority = priority;
      if (category) whereClause.category = category;

      const [cases, total] = await Promise.all([
        prisma.case.findMany({
          where: whereClause,
          include: { citizen: true, assignments: { include: { user: true } } },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.case.count({ where: whereClause }),
      ]);

      return reply.send({
        data: cases,
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

  // 3. Get single case with all relations
  fastify.get('/cases/:id', { preValidation: auth }, async (request, reply) => {
    try {
      const { id } = request.params as IdParam;
      const caseDetails = await prisma.case.findUnique({
        where: { id },
        include: {
          citizen: true,
          approvedBy: true,
          responsibleAuthority: true,
          stakeholders: { include: { official: true } },
          assignments: { include: { user: true } },
          comments: { include: { user: true }, orderBy: { createdAt: 'desc' } },
          files: true,
          communicationLogs: { include: { user: true }, orderBy: { createdAt: 'desc' } },
          auditLogs: { include: { user: true }, orderBy: { createdAt: 'desc' } },
        },
      });

      if (!caseDetails) return reply.status(404).send({ error: 'Case not found', code: 'NOT_FOUND' });
      return reply.send(caseDetails);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // 4. Authorization: Approve / Reject / Request Clarification / Resolve Without Meeting
  fastify.patch('/cases/:id/authorize', { preValidation: auth }, async (request, reply) => {
    try {
      const { id } = request.params as IdParam;
      const body = approveRejectSchema.parse(request.body);
      const user = request.user;

      const c = await prisma.case.findUnique({ where: { id } });
      if (!c) return reply.status(404).send({ error: 'Case not found', code: 'NOT_FOUND' });
      if (c.status !== 'PENDING_APPROVAL' && c.status !== 'ON_HOLD') {
        return reply.status(400).send({ error: 'Case is not pending approval', code: 'INVALID_STATUS' });
      }

      const status = body.action === 'APPROVE' ? 'APPROVED'
        : body.action === 'REJECT' ? 'REJECTED'
        : body.action === 'RESOLVE_WITHOUT_MEETING' ? 'CLOSED'
        : 'ON_HOLD';

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.case.update({
          where: { id },
          data: {
            status,
            rejectionReason: body.action === 'REJECT' ? (body.rejectionReason || 'No reason provided') : undefined,
            approvedAt: body.action === 'APPROVE' ? new Date() : undefined,
            approvedByUserId: body.action === 'APPROVE' ? user.id : undefined,
            resolvedWithoutMeeting: body.action === 'RESOLVE_WITHOUT_MEETING' ? true : undefined,
            resolutionNotes: body.action === 'RESOLVE_WITHOUT_MEETING' ? (body.resolutionNotes || '') : undefined,
          },
        });
        await logAudit(`CASE_${body.action}`, { status }, id, user.id, tx);
        return result;
      });

      return reply.send(updated);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // 5. Scheduling: set date, time, type, venue/link
  fastify.patch('/cases/:id/schedule', { preValidation: auth }, async (request, reply) => {
    try {
      const { id } = request.params as IdParam;
      const data = scheduleMeetingSchema.parse(request.body);
      const user = request.user;

      const c = await prisma.case.findUnique({ where: { id } });
      if (!c) return reply.status(404).send({ error: 'Case not found', code: 'NOT_FOUND' });
      if (c.status !== 'APPROVED') {
        return reply.status(400).send({ error: 'Only approved requests can be scheduled', code: 'INVALID_STATUS' });
      }

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      if (data.scheduledDate < todayStr) {
        return reply.status(400).send({ error: 'Past dates are not allowed', code: 'INVALID_DATE' });
      }

      const scheduledDate = new Date(data.scheduledDate + 'T12:00:00');

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.case.update({
          where: { id },
          data: {
            status: 'SCHEDULED',
            scheduledDate,
            scheduledTimeSlot: data.scheduledTimeSlot,
            meetingType: data.meetingType,
            venueOrLink: data.venueOrLink || undefined,
          },
        });
        await logAudit('CASE_SCHEDULED', { scheduledDate: data.scheduledDate, scheduledTimeSlot: data.scheduledTimeSlot }, id, user.id, tx);
        return result;
      });

      return reply.send(updated);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // 6. Visit day check-in: Arrived / No-show / Rescheduled
  fastify.patch('/cases/:id/checkin', { preValidation: auth }, async (request, reply) => {
    try {
      const { id } = request.params as IdParam;
      const body = visitCheckInSchema.parse(request.body);
      const user = request.user;

      const c = await prisma.case.findUnique({ where: { id } });
      if (!c) return reply.status(404).send({ error: 'Case not found', code: 'NOT_FOUND' });
      if (c.status !== 'SCHEDULED') {
        return reply.status(400).send({ error: 'Only scheduled meetings can be checked in', code: 'INVALID_STATUS' });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.case.update({
          where: { id },
          data: {
            visitCheckIn: body.checkIn,
            status: body.checkIn === 'NO_SHOW' ? 'NO_SHOW' : body.checkIn === 'RESCHEDULED' ? 'RESCHEDULED' : c.status,
          },
        });
        await logAudit('CASE_CHECKIN', { checkIn: body.checkIn }, id, user.id, tx);
        return result;
      });

      return reply.send(updated);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // 7. Post-meeting closure
  fastify.patch('/cases/:id/close', { preValidation: auth }, async (request, reply) => {
    try {
      const { id } = request.params as IdParam;
      const data = closeMeetingSchema.parse(request.body);
      const user = request.user;

      const c = await prisma.case.findUnique({ where: { id } });
      if (!c) return reply.status(404).send({ error: 'Case not found', code: 'NOT_FOUND' });

      const canClose = c.status === 'SCHEDULED' || c.visitCheckIn != null;
      if (!canClose) {
        return reply.status(400).send({
          error: 'Case can only be closed when scheduled or after check-in',
          code: 'INVALID_STATUS',
        });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.case.update({
          where: { id },
          data: {
            status: 'CLOSED',
            closureStatus: data.closureStatus,
            closureNotes: data.closureNotes || undefined,
            meetingSummary: data.meetingSummary || undefined,
            actionRequired: data.actionRequired || undefined,
            responsibleAuthorityId: data.responsibleAuthorityId || undefined,
          },
        });
        await logAudit('CASE_CLOSED', { closureStatus: data.closureStatus, notes: data.closureNotes }, id, user.id, tx);
        return result;
      });

      return reply.send(updated);
    } catch (err) {
      return handleError(err, reply);
    }
  });
}

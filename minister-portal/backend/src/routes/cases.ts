import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createCaseSchema, approveRejectSchema, scheduleMeetingSchema, visitCheckInSchema, closeMeetingSchema } from '../utils/validation';
import { generateCaseId } from '../utils/caseId';
import { logAudit } from '../services/audit';

const prisma = new PrismaClient();

const auth = [async (request: any, reply: any) => {
  try { await request.jwtVerify(); } catch (err) { reply.send(err); }
}];

export default async function caseRoutes(fastify: FastifyInstance) {
  // 1. Request submission – require referring officer & reference mode
  fastify.post('/cases', { preValidation: auth }, async (request, reply) => {
    try {
      const data = createCaseSchema.parse(request.body);
      const user = (request.user as any);

      const caseIdString = await generateCaseId();

      const newCase = await prisma.case.create({
        data: {
          caseId: caseIdString,
          citizenId: data.citizenId,
          purpose: data.purpose,
          meetingDate: data.meetingDate ? new Date(data.meetingDate) : null,
          status: 'PENDING_APPROVAL',
          priority: 'MEDIUM',
          referringOfficer: data.referringOfficer,
          referenceMode: data.referenceMode,
          supportingNotePath: data.supportingNotePath || undefined,
        }
      });

      await logAudit('CASE_CREATED', { newCase }, newCase.id, user.id);

      return reply.send(newCase);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  fastify.get('/cases', {
    preValidation: [async (request, reply) => {
      try { await request.jwtVerify() } catch (err) { reply.send(err) }
    }]
  }, async (request, reply) => {
    // Pagination & Search
    const { page = 1, limit = 10, search, status, priority } = request.query as any;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    let whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { caseId: { contains: search } },
        { citizen: { name: { contains: search } } },
        { citizen: { phone: { contains: search } } }
      ];
    }
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where: whereClause,
        include: { citizen: true, assignments: { include: { user: true } } },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.case.count({ where: whereClause })
    ]);

    return reply.send({
      data: cases,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  });

  fastify.get('/cases/:id', {
    preValidation: [async (request, reply) => {
      try { await request.jwtVerify() } catch (err) { reply.send(err) }
    }]
  }, async (request, reply) => {
    const { id } = request.params as any;
    const caseDetails = await prisma.case.findUnique({
      where: { id },
      include: {
        citizen: true,
        approvedBy: true,
        stakeholders: { include: { official: true } },
        assignments: { include: { user: true } },
        comments: { include: { user: true }, orderBy: { createdAt: 'desc' } },
        files: true,
        auditLogs: { include: { user: true }, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!caseDetails) return reply.status(404).send({ error: 'Case not found' });
    
    return reply.send(caseDetails);
  });

  // 2. Authorization: Approve / Reject / Request Clarification
  fastify.patch('/cases/:id/authorize', { preValidation: auth }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const body = approveRejectSchema.parse(request.body);
      const user = (request.user as any);

      const c = await prisma.case.findUnique({ where: { id } });
      if (!c) return reply.status(404).send({ error: 'Case not found' });
      if (c.status !== 'PENDING_APPROVAL' && c.status !== 'ON_HOLD')
        return reply.status(400).send({ error: 'Case is not pending approval' });

      const status = body.action === 'APPROVE' ? 'APPROVED'
        : body.action === 'REJECT' ? 'REJECTED'
        : 'ON_HOLD';

      const updated = await prisma.case.update({
        where: { id },
        data: {
          status,
          rejectionReason: body.action === 'REJECT' ? (body.rejectionReason || 'No reason provided') : undefined,
          approvedAt: body.action === 'APPROVE' ? new Date() : undefined,
          approvedByUserId: body.action === 'APPROVE' ? user.id : undefined,
        }
      });
      await logAudit(`CASE_${body.action}`, { status }, id, user.id);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  // 3. Scheduling: set date, time, type, venue/link (today or future only; double-booking check can be added)
  fastify.patch('/cases/:id/schedule', { preValidation: auth }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const data = scheduleMeetingSchema.parse(request.body);
      const user = (request.user as any);

      const c = await prisma.case.findUnique({ where: { id } });
      if (!c) return reply.status(404).send({ error: 'Case not found' });
      if (c.status !== 'APPROVED')
        return reply.status(400).send({ error: 'Only approved requests can be scheduled' });

      // Compare calendar dates in server local time to avoid UTC/local mismatch
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      if (data.scheduledDate < todayStr)
        return reply.status(400).send({ error: 'Past dates are not allowed' });

      const scheduledDate = new Date(data.scheduledDate + 'T12:00:00'); // noon to avoid UTC-midnight edge cases

      const updated = await prisma.case.update({
        where: { id },
        data: {
          status: 'SCHEDULED',
          scheduledDate,
          scheduledTimeSlot: data.scheduledTimeSlot,
          meetingType: data.meetingType,
          venueOrLink: data.venueOrLink || undefined,
        }
      });
      await logAudit('CASE_SCHEDULED', { scheduledDate: data.scheduledDate, scheduledTimeSlot: data.scheduledTimeSlot }, id, user.id);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  // 5. Visit day check-in: Arrived / No-show / Rescheduled
  fastify.patch('/cases/:id/checkin', { preValidation: auth }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const body = visitCheckInSchema.parse(request.body);
      const user = (request.user as any);

      const c = await prisma.case.findUnique({ where: { id } });
      if (!c) return reply.status(404).send({ error: 'Case not found' });
      if (c.status !== 'SCHEDULED')
        return reply.status(400).send({ error: 'Only scheduled meetings can be checked in' });

      const updated = await prisma.case.update({
        where: { id },
        data: {
          visitCheckIn: body.checkIn,
          status: body.checkIn === 'NO_SHOW' ? 'NO_SHOW' : body.checkIn === 'RESCHEDULED' ? 'RESCHEDULED' : c.status,
        }
      });
      await logAudit('CASE_CHECKIN', { checkIn: body.checkIn }, id, user.id);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  // 6. Post-meeting closure (only when scheduled or check-in recorded)
  fastify.patch('/cases/:id/close', { preValidation: auth }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const data = closeMeetingSchema.parse(request.body);
      const user = (request.user as any);

      const c = await prisma.case.findUnique({ where: { id } });
      if (!c) return reply.status(404).send({ error: 'Case not found' });

      const canClose = c.status === 'SCHEDULED' || c.visitCheckIn != null;
      if (!canClose)
        return reply.status(400).send({ error: 'Case can only be closed when scheduled or after check-in (Arrived / No-show / Rescheduled)' });

      const updated = await prisma.case.update({
        where: { id },
        data: {
          status: 'CLOSED',
          closureStatus: data.closureStatus,
          closureNotes: data.closureNotes || undefined,
        }
      });
      await logAudit('CASE_CLOSED', { closureStatus: data.closureStatus, notes: data.closureNotes }, id, user.id);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Validation failed', details: err.errors || err.message });
    }
  });
}

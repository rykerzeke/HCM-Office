import { FastifyInstance } from 'fastify';
import { CaseStatus, AssignmentStatus } from '@prisma/client';
import { z } from 'zod';
import prisma from '../data/prisma';
import { assignCaseSchema, updateAssignmentSchema, manualCaseStatusEnum } from '../utils/validation';
import { logAudit } from '../services/audit';
import { authenticate } from '../middleware/authenticate';
import { requireStaffOrAdmin } from '../middleware/authorize';
import { handleError } from '../utils/errors';
import { CaseIdParam, CaseAndAssignmentParam } from '../types/fastify';

const statusBodySchema = z.object({ status: manualCaseStatusEnum });

export default async function assignmentRoutes(fastify: FastifyInstance) {
  fastify.post('/cases/:caseId/assignments', {
    preValidation: [authenticate],
  }, async (request, reply) => {
    try {
      const { caseId } = request.params as CaseIdParam;
      const data = assignCaseSchema.parse(request.body);
      const user = request.user;

      const assignment = await prisma.$transaction(async (tx) => {
        const created = await tx.assignment.create({
          data: {
            caseId,
            userId: data.userId,
            notes: data.notes,
            dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            status: data.status || 'PENDING',
          },
          include: { user: true },
        });

        if (data.priority) {
          await tx.case.update({ where: { id: caseId }, data: { priority: data.priority } });
        }

        await logAudit('CASE_ASSIGNED', { toUser: created.user.name, priority: data.priority }, caseId, user.id, tx);
        return created;
      });

      return reply.send(assignment);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // Direct status override — restricted to STAFF/ADMIN and only allows safe
  // intermediate statuses. Terminal transitions (CLOSED, REJECTED) must go
  // through the dedicated workflow endpoints (authorize / close).
  fastify.patch('/cases/:caseId/status', {
    preValidation: [authenticate, requireStaffOrAdmin],
  }, async (request, reply) => {
    try {
      const { caseId } = request.params as CaseIdParam;
      // Validate against the whitelist — rejects CLOSED/REJECTED/legacy statuses
      const { status } = statusBodySchema.parse(request.body);
      const user = request.user;

      const updatedCase = await prisma.$transaction(async (tx) => {
        const result = await tx.case.update({ where: { id: caseId }, data: { status: status as CaseStatus } });
        await logAudit('STATUS_CHANGED', { status }, caseId, user.id, tx);
        return result;
      });

      return reply.send(updatedCase);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  fastify.patch('/cases/:caseId/assignments/:assignmentId', {
    preValidation: [authenticate],
  }, async (request, reply) => {
    try {
      const { caseId, assignmentId } = request.params as CaseAndAssignmentParam;
      // Validated body — rejects unknown keys and invalid status values
      const body = updateAssignmentSchema.parse(request.body);
      const user = request.user;

      const assignment = await prisma.assignment.findFirst({ where: { id: assignmentId, caseId } });
      if (!assignment) return reply.status(404).send({ error: 'Assignment not found', code: 'NOT_FOUND' });

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.assignment.update({
          where: { id: assignmentId },
          data: {
            ...(body.dueDate != null && { dueDate: new Date(body.dueDate) }),
            ...(body.status != null && { status: body.status as AssignmentStatus }),
            ...(body.notes != null && { notes: body.notes }),
          },
          include: { user: true },
        });
        await logAudit('ASSIGNMENT_UPDATED', { assignmentId, updates: body }, caseId, user.id, tx);
        return result;
      });

      return reply.send(updated);
    } catch (err) {
      return handleError(err, reply);
    }
  });
}

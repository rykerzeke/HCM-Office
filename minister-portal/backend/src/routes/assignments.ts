import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { assignCaseSchema } from '../utils/validation';
import { logAudit } from '../services/audit';

const prisma = new PrismaClient();

export default async function assignmentRoutes(fastify: FastifyInstance) {
  fastify.post('/cases/:caseId/assignments', {
    preValidation: [async (request, reply) => {
      try { await request.jwtVerify() } catch (err) { reply.send(err) }
    }]
  }, async (request, reply) => {
    try {
      const { caseId } = request.params as any;
      const data = assignCaseSchema.parse(request.body);
      const user = (request.user as any);

      const assignment = await prisma.assignment.create({
        data: {
          caseId,
          userId: data.userId,
          notes: data.notes,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          status: data.status || 'PENDING',
        },
        include: { user: true }
      });

      if (data.priority) {
        await prisma.case.update({
          where: { id: caseId },
          data: { priority: data.priority }
        });
      }

      await logAudit('CASE_ASSIGNED', { toUser: assignment.user.name, priority: data.priority }, caseId, user.id);

      return reply.send(assignment);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Failed to assign case', details: err.errors });
    }
  });

  fastify.patch('/cases/:caseId/status', {
    preValidation: [async (request, reply) => {
      try { await request.jwtVerify() } catch (err) { reply.send(err) }
    }]
  }, async (request, reply) => {
    try {
      const { caseId } = request.params as any;
      const { status } = request.body as any;
      const user = (request.user as any);

      const updatedCase = await prisma.case.update({
        where: { id: caseId },
        data: { status }
      });

      await logAudit('STATUS_CHANGED', { status }, caseId, user.id);

      return reply.send(updatedCase);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Failed to update status' });
    }
  });

  fastify.patch('/cases/:caseId/assignments/:assignmentId', {
    preValidation: [async (request, reply) => {
      try { await request.jwtVerify() } catch (err) { reply.send(err) }
    }]
  }, async (request, reply) => {
    try {
      const { caseId, assignmentId } = request.params as any;
      const body = request.body as any;
      const user = (request.user as any);

      const assignment = await prisma.assignment.findFirst({
        where: { id: assignmentId, caseId }
      });
      if (!assignment) return reply.status(404).send({ error: 'Assignment not found' });

      const updated = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          ...(body.dueDate != null && { dueDate: new Date(body.dueDate) }),
          ...(body.status != null && { status: body.status }),
          ...(body.notes != null && { notes: body.notes }),
        },
        include: { user: true }
      });
      await logAudit('ASSIGNMENT_UPDATED', { assignmentId, updates: body }, caseId, user.id);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Failed to update assignment' });
    }
  });
}

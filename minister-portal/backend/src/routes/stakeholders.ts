import { FastifyInstance } from 'fastify';
import prisma from '../data/prisma';
import { logAudit } from '../services/audit';
import { authenticate } from '../middleware/authenticate';
import { handleError } from '../utils/errors';
import { CaseIdParam, CaseAndOfficialParam } from '../types/fastify';

export default async function stakeholderRoutes(fastify: FastifyInstance) {
  fastify.post('/cases/:caseId/stakeholders', {
    preValidation: [authenticate],
  }, async (request, reply) => {
    try {
      const { caseId } = request.params as CaseIdParam;
      const { officialId } = request.body as { officialId: string };
      const user = request.user;

      const mapping = await prisma.$transaction(async (tx) => {
        const created = await tx.stakeholderMapping.create({
          data: { caseId, officialId },
          include: { official: true },
        });
        await logAudit('STAKEHOLDER_MAPPED', { official: created.official.name }, caseId, user.id, tx);
        return created;
      });

      return reply.send(mapping);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  fastify.delete('/cases/:caseId/stakeholders/:officialId', {
    preValidation: [authenticate],
  }, async (request, reply) => {
    try {
      const { caseId, officialId } = request.params as CaseAndOfficialParam;
      const user = request.user;

      await prisma.$transaction(async (tx) => {
        await tx.stakeholderMapping.delete({
          where: { caseId_officialId: { caseId, officialId } },
        });
        await logAudit('STAKEHOLDER_UNMAPPED', { officialId }, caseId, user.id, tx);
      });

      return reply.send({ success: true });
    } catch (err) {
      return handleError(err, reply);
    }
  });
}

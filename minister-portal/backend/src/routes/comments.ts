import type { FastifyInstance } from 'fastify';
import prisma from '../data/prisma';
import { createCommentSchema } from '../utils/validation';
import { logAudit } from '../services/audit';
import { authenticate } from '../middleware/authenticate';
import { handleError } from '../utils/errors';
import { CaseIdParam } from '../types/fastify';

export default async function commentRoutes(fastify: FastifyInstance) {
  fastify.post('/cases/:caseId/comments', {
    preValidation: [authenticate],
  }, async (request, reply) => {
    try {
      const { caseId } = request.params as CaseIdParam;
      const data = createCommentSchema.parse(request.body);
      const user = request.user;

      const comment = await prisma.$transaction(async (tx) => {
        const created = await tx.comment.create({
          data: {
            content: data.content,
            imageUrl: data.imageUrl,
            caseId,
            userId: user.id,
          },
          include: { user: true },
        });
        await logAudit('COMMENT_ADDED', { length: data.content.length }, caseId, user.id, tx);
        return created;
      });

      return reply.send(comment);
    } catch (err) {
      return handleError(err, reply);
    }
  });
}

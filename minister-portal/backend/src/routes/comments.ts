import type { FastifyInstance } from 'fastify';
import prisma from '../data/prisma';
import { createCommentSchema } from '../utils/validation';
import { logAudit } from '../services/audit';
import { authenticate } from '../middleware/authenticate';

export default async function commentRoutes(fastify: FastifyInstance) {
  fastify.post('/cases/:caseId/comments', {
    preValidation: [authenticate]
  }, async (request, reply) => {
    try {
      const { caseId } = request.params as any;
      const data = createCommentSchema.parse(request.body);
      const user = (request.user as any);

      const comment = await prisma.comment.create({
        data: {
          content: data.content,
          imageUrl: data.imageUrl,
          caseId,
          userId: user.id
        },
        include: { user: true }
      });

      await logAudit('COMMENT_ADDED', { length: data.content.length }, caseId, user.id);

      return reply.send(comment);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Failed to add comment', details: err.errors });
    }
  });
}

import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createCommentSchema } from '../utils/validation';
import { logAudit } from '../services/audit';

const prisma = new PrismaClient();

export default async function commentRoutes(fastify: FastifyInstance) {
  fastify.post('/cases/:caseId/comments', {
    preValidation: [async (request, reply) => {
      try { await request.jwtVerify() } catch (err) { reply.send(err) }
    }]
  }, async (request, reply) => {
    try {
      const { caseId } = request.params as any;
      const data = createCommentSchema.parse(request.body);
      const user = (request.user as any);

      const comment = await prisma.comment.create({
        data: {
          content: data.content,
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

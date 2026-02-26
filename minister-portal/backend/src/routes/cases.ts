import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createCaseSchema } from '../utils/validation';
import { generateCaseId } from '../utils/caseId';
import { logAudit } from '../services/audit';

const prisma = new PrismaClient();

export default async function caseRoutes(fastify: FastifyInstance) {
  fastify.post('/cases', {
    preValidation: [async (request, reply) => {
      try { await request.jwtVerify() } catch (err) { reply.send(err) }
    }]
  }, async (request, reply) => {
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
          status: 'PENDING',
          priority: 'MEDIUM',
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
        { caseId: { contains: search, mode: 'insensitive' } },
        { citizen: { name: { contains: search, mode: 'insensitive' } } },
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
}

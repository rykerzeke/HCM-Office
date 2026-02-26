import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function reportRoutes(fastify: FastifyInstance) {
  fastify.get('/reports', {
    preValidation: [async (request, reply) => {
      try { await request.jwtVerify() } catch (err) { reply.send(err) }
    }]
  }, async (request, reply) => {
    // Generate simple aggregation reports
    const districtWise = await prisma.case.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    const workload = await prisma.assignment.groupBy({
      by: ['userId'],
      _count: { id: true }
    });
    
    // In a real application, we'd add PDF/Excel export endpoints here
    // using libraries like pdfkit or exceljs.
    
    return reply.send({
      districtWise,
      workload
    });
  });
}

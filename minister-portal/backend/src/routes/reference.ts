import { FastifyInstance } from 'fastify';
import { RequestCategory } from '@prisma/client';
import prisma from '../data/prisma';
import { authenticate } from '../middleware/authenticate';
import { handleError } from '../utils/errors';
import { StateQuery, OfficialsQuery, SuggestedOfficialsQuery } from '../types/fastify';

// Minister Meeting Workflow: fixed referring officers
const REFERRING_OFFICERS = [
  { id: 'VISHAL_GUPTA', name: 'Vishal Gupta' },
  { id: 'MAHENDRA_PRATAP_SINGH', name: 'Mahendra Pratap Singh' },
  { id: 'CHIRAG_PANCHAL', name: 'Chirag Panchal' },
];

const REFERENCE_MODES = [
  { id: 'CALL', name: 'Call' },
  { id: 'EMAIL', name: 'Email' },
  { id: 'WRITTEN', name: 'Written' },
  { id: 'IN_PERSON', name: 'In-person' },
];

const REQUEST_CATEGORIES = [
  { id: 'PUBLIC_GRIEVANCE', name: 'Public Grievance' },
  { id: 'POLICY_REQUEST', name: 'Policy Request' },
  { id: 'PERSONAL_ISSUE', name: 'Personal Issue' },
  { id: 'LAND_AND_REVENUE', name: 'Land & Revenue' },
  { id: 'CIVIC_ISSUE', name: 'Civic Issue' },
  { id: 'PENSION_AND_WELFARE', name: 'Pension & Welfare' },
  { id: 'OTHER', name: 'Other' },
];

export default async function referenceRoutes(fastify: FastifyInstance) {
  fastify.get('/referring-officers', async (_request, reply) => {
    return reply.send(REFERRING_OFFICERS);
  });

  fastify.get('/reference-modes', async (_request, reply) => {
    return reply.send(REFERENCE_MODES);
  });

  fastify.get('/request-categories', async (_request, reply) => {
    return reply.send(REQUEST_CATEGORIES);
  });

  fastify.get('/states', async (_request, reply) => {
    try {
      const states = await prisma.state.findMany({ orderBy: { name: 'asc' } });
      return reply.send(states);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  fastify.get('/districts', async (request, reply) => {
    try {
      const { stateId } = request.query as StateQuery;
      const where = stateId ? { stateId } : {};
      const districts = await prisma.district.findMany({ where, orderBy: { name: 'asc' } });
      return reply.send(districts);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // Protected — officials list includes contact details (phone, email, address)
  fastify.get('/officials', {
    preValidation: [authenticate],
  }, async (request, reply) => {
    try {
      const { stateId, districtId, search } = request.query as OfficialsQuery;

      const whereClause: Record<string, unknown> = {};
      if (stateId) whereClause.stateId = stateId;
      if (districtId) whereClause.districtId = districtId;
      if (search) whereClause.name = { contains: search };

      const officials = await prisma.official.findMany({
        where: whereClause,
        include: { state: true, district: true },
        orderBy: { name: 'asc' },
      });
      return reply.send(officials);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // Protected — suggested officials by category
  fastify.get('/officials/suggested', {
    preValidation: [authenticate],
  }, async (request, reply) => {
    try {
      const { category, stateId, districtId } = request.query as SuggestedOfficialsQuery;
      if (!category) return reply.send([]);

      const mapping = await prisma.categoryDepartment.findFirst({ where: { category: category as RequestCategory } });
      if (!mapping) return reply.send([]);

      const whereClause: Record<string, unknown> = {
        OR: [
          { department: { contains: mapping.departmentKeyword } },
          { designation: { contains: mapping.departmentKeyword } },
        ],
      };
      if (stateId) whereClause.stateId = stateId;
      if (districtId) whereClause.districtId = districtId;

      const officials = await prisma.official.findMany({
        where: whereClause,
        include: { state: true, district: true },
        orderBy: { name: 'asc' },
        take: 10,
      });
      return reply.send(officials);
    } catch (err) {
      return handleError(err, reply);
    }
  });
}

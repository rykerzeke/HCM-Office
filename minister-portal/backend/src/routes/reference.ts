import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

export default async function referenceRoutes(fastify: FastifyInstance) {
  fastify.get('/referring-officers', async (_request, reply) => {
    return reply.send(REFERRING_OFFICERS);
  });

  fastify.get('/reference-modes', async (_request, reply) => {
    return reply.send(REFERENCE_MODES);
  });

  const REQUEST_CATEGORIES = [
    { id: 'PUBLIC_GRIEVANCE', name: 'Public Grievance' },
    { id: 'POLICY_REQUEST', name: 'Policy Request' },
    { id: 'PERSONAL_ISSUE', name: 'Personal Issue' },
    { id: 'LAND_AND_REVENUE', name: 'Land & Revenue' },
    { id: 'CIVIC_ISSUE', name: 'Civic Issue' },
    { id: 'PENSION_AND_WELFARE', name: 'Pension & Welfare' },
    { id: 'OTHER', name: 'Other' },
  ];
  fastify.get('/request-categories', async (_request, reply) => {
    return reply.send(REQUEST_CATEGORIES);
  });

  fastify.get('/states', async (request, reply) => {
    const states = await prisma.state.findMany({ orderBy: { name: 'asc' } });
    return reply.send(states);
  });

  fastify.get('/districts', async (request, reply) => {
    const { stateId } = request.query as any;
    let whereClause = {};
    if (stateId) whereClause = { stateId };
    
    const districts = await prisma.district.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });
    return reply.send(districts);
  });

  fastify.get('/officials', async (request, reply) => {
    const { stateId, districtId, search } = request.query as any;
    
    let whereClause: any = {};
    if (stateId) whereClause.stateId = stateId;
    if (districtId) whereClause.districtId = districtId;
    if (search) {
      whereClause.name = { contains: search };
    }

    const officials = await prisma.official.findMany({
      where: whereClause,
      include: { state: true, district: true },
      orderBy: { name: 'asc' }
    });
    return reply.send(officials);
  });

  // Suggested officials by request category (department keyword match)
  fastify.get('/officials/suggested', async (request, reply) => {
    const { category, stateId, districtId } = request.query as any;
    if (!category) return reply.send([]);
    const mapping = await prisma.categoryDepartment.findFirst({
      where: { category }
    });
    if (!mapping) return reply.send([]);
    const keyword = mapping.departmentKeyword.toLowerCase();
    const whereClause: any = {
      OR: [
        { department: { contains: mapping.departmentKeyword } },
        { designation: { contains: mapping.departmentKeyword } },
      ]
    };
    if (stateId) whereClause.stateId = stateId;
    if (districtId) whereClause.districtId = districtId;
    const officials = await prisma.official.findMany({
      where: whereClause,
      include: { state: true, district: true },
      orderBy: { name: 'asc' },
      take: 10
    });
    return reply.send(officials);
  });
}

import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyJwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import uploadsDir from './utils/uploadsDir';


import authRoutes from './routes/auth';
import citizenRoutes from './routes/citizens';
import caseRoutes from './routes/cases';
import stakeholderRoutes from './routes/stakeholders';
import assignmentRoutes from './routes/assignments';
import commentRoutes from './routes/comments';
import communicationRoutes from './routes/communications';
import fileRoutes from './routes/files';
import auditRoutes from './routes/audit';
import dashboardRoutes from './routes/dashboard';
import referenceRoutes from './routes/reference';
import reportRoutes from './routes/reports';
import publicRoutes from './routes/public';
import prisma from './data/prisma';


if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}

const server = fastify({ logger: true });

// Security headers — helmet sets X-Content-Type-Options, X-Frame-Options, HSTS, etc.
// contentSecurityPolicy is disabled here because the API serves JSON only (no HTML);
// the frontend enforces its own CSP via Vite/Vercel headers.
server.register(helmet, { contentSecurityPolicy: false });

// CORS
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

server.register(cors, {
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

// JWT
server.register(fastifyJwt, {
  secret: process.env.JWT_SECRET,
});

// Rate limiting — generous global defaults; login route applies stricter limits
server.register(rateLimit, {
  global: true,
  max: 200,
  timeWindow: '1 minute',
  errorResponseBuilder: () => ({
    error: 'Too many requests',
    code: 'RATE_LIMITED',
  }),
});

// Multipart file upload — 10 MB per file, max 5 files per request
server.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 5,
  },
});

// Static file serving for uploaded documents — shares resolution logic with file upload route
server.register(fastifyStatic, {
  root: uploadsDir,
  prefix: '/uploads/',
});

// ---------------------------------------------------------------------------
// Routes — registered under /api/v1 (primary) and /api (backward compat)
// ---------------------------------------------------------------------------
const V1 = '/api/v1';
const V0 = '/api'; // legacy prefix kept so existing frontend calls keep working

for (const prefix of [V1, V0]) {
  server.register(authRoutes, { prefix });
  server.register(citizenRoutes, { prefix });
  server.register(caseRoutes, { prefix });
  server.register(stakeholderRoutes, { prefix });
  server.register(assignmentRoutes, { prefix });
  server.register(commentRoutes, { prefix });
  server.register(communicationRoutes, { prefix });
  server.register(fileRoutes, { prefix });
  server.register(auditRoutes, { prefix });
  server.register(dashboardRoutes, { prefix });
  server.register(referenceRoutes, { prefix });
  server.register(reportRoutes, { prefix });
  server.register(publicRoutes, { prefix });
}

// Root endpoint
server.get('/', async () => ({ status: 'OK', service: 'HCM Minister Portal API', version: '1.0' }));

// Health check (not versioned)
server.get('/health', async () => ({ status: 'OK' }));

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
const shutdown = async (signal: string) => {
  server.log.info(`Received ${signal}, shutting down gracefully...`);
  await server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => { shutdown('SIGTERM').catch(console.error); });
process.on('SIGINT', () => { shutdown('SIGINT').catch(console.error); });

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
const start = async () => {
  try {
    await server.listen({ port: Number(process.env.PORT) || 4000, host: '0.0.0.0' });
    server.log.info(`Server listening on port ${process.env.PORT || 4000}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

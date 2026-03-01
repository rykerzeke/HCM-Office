import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import path from 'node:path';
import fastifyStatic from '@fastify/static';
import dotenv from 'dotenv';

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

dotenv.config();

const server = fastify({ logger: true });

// Plugins
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

server.register(cors, {
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}

server.register(fastifyJwt, {
  secret: process.env.JWT_SECRET,
});

server.register(multipart);

// Routes
server.register(authRoutes, { prefix: '/api' });
server.register(citizenRoutes, { prefix: '/api' });
server.register(caseRoutes, { prefix: '/api' });
server.register(stakeholderRoutes, { prefix: '/api' });
server.register(assignmentRoutes, { prefix: '/api' });
server.register(commentRoutes, { prefix: '/api' });
server.register(communicationRoutes, { prefix: '/api' });
server.register(fileRoutes, { prefix: '/api' });
server.register(auditRoutes, { prefix: '/api' });
server.register(dashboardRoutes, { prefix: '/api' });
server.register(referenceRoutes, { prefix: '/api' });
server.register(reportRoutes, { prefix: '/api' });
server.register(publicRoutes, { prefix: '/api' });

// Health Check
server.get('/health', async () => {
  return { status: 'OK' };
});



const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '../uploads');

server.register(fastifyStatic, {
  root: uploadsDir,
  prefix: '/uploads/',
});

const start = async () => {
  try {
    await server.listen({ port: Number(process.env.PORT) || 4000, host: '0.0.0.0' });
    console.log(`Server listening on port ${process.env.PORT || 4000}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

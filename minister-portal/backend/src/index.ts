import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import citizenRoutes from './routes/citizens';
import caseRoutes from './routes/cases';
import stakeholderRoutes from './routes/stakeholders';
import assignmentRoutes from './routes/assignments';
import commentRoutes from './routes/comments';
import fileRoutes from './routes/files';
import auditRoutes from './routes/audit';
import dashboardRoutes from './routes/dashboard';
import referenceRoutes from './routes/reference';
import reportRoutes from './routes/reports';

dotenv.config();

const server = fastify({ logger: true });

// Plugins
server.register(cors, {
  origin: '*',
});

server.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'supersecretkey123',
});

server.register(multipart);

// Routes
server.register(authRoutes, { prefix: '/api' });
server.register(citizenRoutes, { prefix: '/api' });
server.register(caseRoutes, { prefix: '/api' });
server.register(stakeholderRoutes, { prefix: '/api' });
server.register(assignmentRoutes, { prefix: '/api' });
server.register(commentRoutes, { prefix: '/api' });
server.register(fileRoutes, { prefix: '/api' });
server.register(auditRoutes, { prefix: '/api' });
server.register(dashboardRoutes, { prefix: '/api' });
server.register(referenceRoutes, { prefix: '/api' });
server.register(reportRoutes, { prefix: '/api' });

// Health Check
server.get('/health', async () => {
  return { status: 'OK' };
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

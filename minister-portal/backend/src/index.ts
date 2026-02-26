import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import citizenRoutes from './routes/citizens';
import caseRoutes from './routes/cases';

dotenv.config();

const server = fastify({ logger: true });

// Plugins
server.register(cors, {
  origin: '*',
});

server.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'supersecretkey123',
});

server.register(multipart, {
  attachFieldsToBody: true,
});

// Routes
server.register(authRoutes, { prefix: '/api' });
server.register(citizenRoutes, { prefix: '/api' });
server.register(caseRoutes, { prefix: '/api' });

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

import { FastifyInstance } from 'fastify';
import prisma from '../data/prisma';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { logAudit } from '../services/audit';
import { authenticate } from '../middleware/authenticate';
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export default async function fileRoutes(fastify: FastifyInstance) {
  fastify.post('/cases/:caseId/files', {
    preValidation: [authenticate]
  }, async (request, reply) => {
    try {
      const { caseId } = request.params as any;
      const user = (request.user as any);
      
      const parts = request.parts();
      const filesUploaded = [];

      for await (const part of parts) {
        if (part.type === 'file') {
          const filename = `${Date.now()}-${part.filename}`;
          const filePath = path.join(UPLOAD_DIR, filename);
          await pipeline(part.file, fs.createWriteStream(filePath));
          
          const fileRecord = await prisma.file.create({
            data: {
              caseId,
              filename: part.filename,
              path: `/uploads/${filename}`,
              mimetype: part.mimetype,
              size: fs.statSync(filePath).size,
            }
          });
          filesUploaded.push(fileRecord);
        }
      }

      await logAudit('FILE_UPLOADED', { files: filesUploaded.length }, caseId, user.id);

      return reply.send({ success: true, files: filesUploaded });
    } catch (err: any) {
      return reply.status(400).send({ error: 'Failed to upload files', details: err.message });
    }
  });
}

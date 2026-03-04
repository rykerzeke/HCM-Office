import { FastifyInstance } from 'fastify';
import prisma from '../data/prisma';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { logAudit } from '../services/audit';
import { authenticate } from '../middleware/authenticate';
import { handleError, AppError } from '../utils/errors';
import { CaseIdParam } from '../types/fastify';

/** Allowed file extensions (must match ALLOWED_MIME_TYPES). */
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt']);

/**
 * Produce a safe storage filename from the original.
 * Uses a random UUID prefix so stored names are unguessable, then appends
 * only the whitelisted extension — never the caller-supplied basename,
 * which prevents path-traversal and special-character injection.
 */
function safeFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '';
  return `${crypto.randomUUID()}${safeExt}`;
}

// Use the same resolution logic as src/index.ts so uploads are written to the
// exact directory that Fastify exposes via fastify-static.
import uploadsDir from '../utils/uploadsDir';
const UPLOAD_DIR = uploadsDir;

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default async function fileRoutes(fastify: FastifyInstance) {
  fastify.post('/cases/:caseId/files', {
    preValidation: [authenticate],
  }, async (request, reply) => {
    try {
      const { caseId } = request.params as CaseIdParam;
      const user = request.user;

      const parts = request.parts();
      const filesUploaded = [];

      for await (const part of parts) {
        if (part.type === 'file') {
          // Validate MIME type before writing
          if (!ALLOWED_MIME_TYPES.has(part.mimetype)) {
            part.file.resume(); // drain to avoid memory leak
            throw new AppError(
              400,
              `File type "${part.mimetype}" is not allowed`,
              'INVALID_FILE_TYPE',
              { allowed: Array.from(ALLOWED_MIME_TYPES) }
            );
          }

          // Generate a safe, unguessable filename — never use the caller-supplied name directly
          const filename = safeFilename(part.filename);
          const filePath = path.join(UPLOAD_DIR, filename);

          await pipeline(part.file, fs.createWriteStream(filePath));

          // Validate file size after write (multipart limits also enforce this at plugin level)
          const stat = fs.statSync(filePath);
          if (stat.size > MAX_FILE_SIZE) {
            fs.unlinkSync(filePath);
            throw new AppError(
              400,
              `File "${part.filename}" exceeds the 10 MB size limit`,
              'FILE_TOO_LARGE',
              { sizeBytes: stat.size, limitBytes: MAX_FILE_SIZE }
            );
          }

          const fileRecord = await prisma.file.create({
            data: {
              caseId,
              filename: part.filename,  // original name kept for display only
              path: `/uploads/${filename}`,  // stored under UUID-based name
              mimetype: part.mimetype,
              size: stat.size,
            },
          });
          filesUploaded.push(fileRecord);
        }
      }

      await logAudit('FILE_UPLOADED', { files: filesUploaded.length }, caseId, user.id);

      return reply.send({ success: true, files: filesUploaded });
    } catch (err) {
      return handleError(err, reply);
    }
  });
}

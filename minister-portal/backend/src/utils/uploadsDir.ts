import path from 'node:path';

/**
 * Single source of truth for the uploads directory.
 *
 * - In production, set UPLOADS_DIR to an absolute path (e.g. /var/data/uploads)
 * - In local dev, defaults to <backend-root>/uploads
 */
const uploadsDir =
  process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

export default uploadsDir;


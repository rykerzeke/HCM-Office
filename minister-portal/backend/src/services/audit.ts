import { Prisma } from '@prisma/client';
import prisma from '../data/prisma';

type PrismaTx = Prisma.TransactionClient;

export async function logAudit(
  action: string,
  details: unknown,
  caseId?: string,
  userId?: string,
  tx?: PrismaTx
): Promise<void> {
  const db = tx ?? prisma;
  try {
    await db.auditLog.create({
      data: {
        action,
        details: JSON.stringify(details),
        caseId,
        userId,
      },
    });
  } catch (err) {
    // Audit log failures are non-fatal — log but don't interrupt the caller
    console.error('Failed to write audit log', err);
  }
}

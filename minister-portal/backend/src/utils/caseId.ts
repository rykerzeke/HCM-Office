import { Prisma } from '@prisma/client';
import prisma from '../data/prisma';

type PrismaTx = Prisma.TransactionClient;

/**
 * Generates the next sequential case ID for the current year (e.g. MO-2026-00042).
 * Pass a Prisma transaction client (`tx`) when calling inside a $transaction to
 * ensure the read and write happen atomically — preventing duplicate IDs under
 * concurrent requests.
 */
export async function generateCaseId(tx?: PrismaTx): Promise<string> {
  const db = tx ?? prisma;
  const year = new Date().getFullYear();
  const prefix = `MO-${year}-`;

  const lastCase = await db.case.findFirst({
    where: { caseId: { startsWith: prefix } },
    orderBy: { caseId: 'desc' },
  });

  let sequence = 1;
  if (lastCase) {
    const lastSequence = parseInt(lastCase.caseId.replace(prefix, ''), 10);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }

  return `${prefix}${sequence.toString().padStart(5, '0')}`;
}

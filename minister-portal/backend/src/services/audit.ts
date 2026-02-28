import prisma from '../data/prisma';

export async function logAudit(
  action: string,
  details: any,
  caseId?: string,
  userId?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        details: JSON.stringify(details),
        caseId,
        userId,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log', err);
  }
}

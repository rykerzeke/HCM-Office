import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function generateCaseId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `MO-${year}-`;
  
  // Find the last case for this year
  const lastCase = await prisma.case.findFirst({
    where: {
      caseId: {
        startsWith: prefix,
      },
    },
    orderBy: {
      caseId: 'desc',
    },
  });

  let sequence = 1;
  if (lastCase) {
    const lastSequenceStr = lastCase.caseId.replace(prefix, '');
    const lastSequence = parseInt(lastSequenceStr, 10);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }

  // Format with leading zeros to 5 digits
  const sequenceFormatted = sequence.toString().padStart(5, '0');
  return `${prefix}${sequenceFormatted}`;
}

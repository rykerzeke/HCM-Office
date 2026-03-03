import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

// Set up mocks before importing the module under test
vi.mock('../data/prisma', () => {
  const mockCase = { findFirst: vi.fn() };
  return { default: { case: mockCase, $transaction: vi.fn() } };
});

// Import after mocking
import { generateCaseId } from '../utils/caseId';
import prismaDefault from '../data/prisma';

const prisma = prismaDefault as unknown as { case: { findFirst: ReturnType<typeof vi.fn> } };
const year = new Date().getFullYear();

describe('generateCaseId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates MO-YEAR-00001 when no cases exist', async () => {
    prisma.case.findFirst.mockResolvedValue(null);
    const id = await generateCaseId();
    expect(id).toBe(`MO-${year}-00001`);
  });

  it('increments from last caseId', async () => {
    prisma.case.findFirst.mockResolvedValue({ caseId: `MO-${year}-00005` });
    const id = await generateCaseId();
    expect(id).toBe(`MO-${year}-00006`);
  });

  it('pads sequence to 5 digits', async () => {
    prisma.case.findFirst.mockResolvedValue({ caseId: `MO-${year}-00099` });
    const id = await generateCaseId();
    expect(id).toBe(`MO-${year}-00100`);
  });

  it('uses the provided transaction client instead of global prisma', async () => {
    const txFindFirst = vi.fn().mockResolvedValue(null);
    const tx = { case: { findFirst: txFindFirst } } as unknown as Prisma.TransactionClient;
    const id = await generateCaseId(tx);
    expect(txFindFirst).toHaveBeenCalled();
    expect(id).toBe(`MO-${year}-00001`);
  });
});

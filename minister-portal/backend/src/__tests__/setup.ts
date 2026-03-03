import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock Prisma so tests don't need a real database connection.
// Individual tests can override specific methods with vi.mocked(prisma.xxx)
// ---------------------------------------------------------------------------
vi.mock('../data/prisma', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    citizen: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    case: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    assignment: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
    },
    comment: {
      create: vi.fn(),
    },
    communicationLog: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    file: {
      create: vi.fn(),
    },
    state: {
      findMany: vi.fn(),
    },
    district: {
      findMany: vi.fn(),
    },
    official: {
      findMany: vi.fn(),
    },
    categoryDepartment: {
      findFirst: vi.fn(),
    },
    stakeholderMapping: {
      create: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => unknown) => fn(mockPrisma)),
    $disconnect: vi.fn(),
  };
  return { default: mockPrisma };
});

// Mock encryption module so tests don't need ENCRYPTION_KEY env var
vi.mock('../utils/encryption', () => ({
  encrypt: vi.fn((text: string) => `encrypted:${text}`),
  decrypt: vi.fn((text: string) => text.replace('encrypted:', '')),
}));

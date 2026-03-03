import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireRole, requireAdmin, requireStaffOrAdmin } from '../middleware/authorize';
import { FastifyRequest, FastifyReply } from 'fastify';

function makeRequest(role?: string): FastifyRequest {
  return {
    user: role ? { id: 'user-1', role, name: 'Test User' } : undefined,
  } as unknown as FastifyRequest;
}

function makeReply() {
  const captured: { status?: number; body?: unknown } = {};
  const replyObj = {
    status: vi.fn((code: number) => {
      captured.status = code;
      return { send: vi.fn((body: unknown) => { captured.body = body; }) };
    }),
    captured,
  };
  return replyObj;
}

describe('requireRole', () => {
  it('allows request when user has matching role', async () => {
    const handler = requireRole('ADMIN');
    const request = makeRequest('ADMIN');
    const reply = makeReply();

    await handler(request, reply as unknown as FastifyReply);

    expect(reply.status).not.toHaveBeenCalled();
  });

  it('blocks request when user has wrong role', async () => {
    const handler = requireRole('ADMIN');
    const request = makeRequest('STAFF');
    const reply = makeReply();

    await handler(request, reply as unknown as FastifyReply);

    expect(reply.status).toHaveBeenCalledWith(403);
  });

  it('blocks request when user is undefined', async () => {
    const handler = requireRole('ADMIN');
    const request = makeRequest();
    const reply = makeReply();

    await handler(request, reply as unknown as FastifyReply);

    expect(reply.status).toHaveBeenCalledWith(403);
  });

  it('allows any of multiple accepted roles', async () => {
    const handler = requireRole('ADMIN', 'STAFF');
    const staffRequest = makeRequest('STAFF');
    const adminRequest = makeRequest('ADMIN');
    const reply1 = makeReply();
    const reply2 = makeReply();

    await handler(staffRequest, reply1 as unknown as FastifyReply);
    await handler(adminRequest, reply2 as unknown as FastifyReply);

    expect(reply1.status).not.toHaveBeenCalled();
    expect(reply2.status).not.toHaveBeenCalled();
  });
});

describe('requireAdmin', () => {
  it('allows ADMIN', async () => {
    const reply = makeReply();
    await requireAdmin(makeRequest('ADMIN'), reply as unknown as FastifyReply);
    expect(reply.status).not.toHaveBeenCalled();
  });

  it('blocks STAFF', async () => {
    const reply = makeReply();
    await requireAdmin(makeRequest('STAFF'), reply as unknown as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(403);
  });
});

describe('requireStaffOrAdmin', () => {
  it('allows STAFF', async () => {
    const reply = makeReply();
    await requireStaffOrAdmin(makeRequest('STAFF'), reply as unknown as FastifyReply);
    expect(reply.status).not.toHaveBeenCalled();
  });

  it('allows ADMIN', async () => {
    const reply = makeReply();
    await requireStaffOrAdmin(makeRequest('ADMIN'), reply as unknown as FastifyReply);
    expect(reply.status).not.toHaveBeenCalled();
  });

  it('blocks OFFICIAL', async () => {
    const reply = makeReply();
    await requireStaffOrAdmin(makeRequest('OFFICIAL'), reply as unknown as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(403);
  });
});

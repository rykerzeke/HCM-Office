import '@fastify/jwt';

// Tell @fastify/jwt what shape the decoded JWT payload has.
// This propagates to request.user automatically via the plugin's type augmentation.
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; role: string; name: string };
    user:    { id: string; role: string; name: string };
  }
}

// ---------------------------------------------------------------------------
// Typed route param / query interfaces shared across route handlers
// ---------------------------------------------------------------------------

export interface IdParam {
  id: string;
}

export interface CaseIdParam {
  caseId: string;
}

export interface CaseAndAssignmentParam {
  caseId: string;
  assignmentId: string;
}

export interface CaseAndOfficialParam {
  caseId: string;
  officialId: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
}

export interface StateQuery {
  stateId?: string;
}

export interface OfficialsQuery {
  stateId?: string;
  districtId?: string;
  search?: string;
}

export interface SuggestedOfficialsQuery {
  category?: string;
  stateId?: string;
  districtId?: string;
}

export interface TrackQuery {
  query?: string;
}

export interface AuditQuery {
  caseId?: string;
  limit?: string;
}

export interface CitizenQuery {
  search?: string;
  page?: string;
  limit?: string;
}

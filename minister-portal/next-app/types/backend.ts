// Types mirroring the Fastify/Prisma backend responses.
// These are kept as plain TS interfaces (not Prisma-generated) so the
// Next BFF layer has zero coupling to Prisma.

export type Role = "ADMIN" | "STAFF" | "OFFICIAL";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type RequestCategory =
  | "PUBLIC_GRIEVANCE"
  | "POLICY_REQUEST"
  | "PERSONAL_ISSUE"
  | "LAND_AND_REVENUE"
  | "CIVIC_ISSUE"
  | "PENSION_AND_WELFARE"
  | "OTHER";

export type CaseStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "ON_HOLD"
  | "SCHEDULED"
  | "COMPLETED"
  | "CLOSED"
  | "NO_SHOW"
  | "RESCHEDULED"
  | "FOLLOW_UP_REQUIRED"
  | "RESCHEDULE_REQUIRED"
  | "PENDING"
  | "IN_PROGRESS"
  | "ESCALATED"
  | "RESOLVED"
  | "ARCHIVED";

export type ManualCaseStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "ON_HOLD"
  | "SCHEDULED"
  | "NO_SHOW"
  | "RESCHEDULED"
  | "FOLLOW_UP_REQUIRED"
  | "RESCHEDULE_REQUIRED";

export type ReferringOfficer =
  | "VISHAL_GUPTA"
  | "MAHENDRA_PRATAP_SINGH"
  | "CHIRAG_PANCHAL";

export type ReferenceMode = "CALL" | "EMAIL" | "WRITTEN" | "IN_PERSON";
export type MeetingType = "IN_PERSON" | "VIRTUAL";
export type VisitCheckIn = "ARRIVED" | "NO_SHOW" | "RESCHEDULED";
export type AssignmentStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "AWAITING_RESPONSE"
  | "RESOLVED"
  | "CLOSED";

// ── Response shapes ──────────────────────────────────────────────────

export interface UserSummary {
  id: string;
  name: string;
  role: Role;
  email?: string;
}

export interface Citizen {
  id: string;
  name: string;
  phone: string;
  aadhaar?: string | null;
  address?: string | null;
  districtId?: string | null;
  stateId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  caseId: string;
  userId: string;
  notes?: string | null;
  dueDate?: string | null;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
  user: UserSummary;
}

export interface CaseSummary {
  id: string;
  caseId: string;
  citizenId: string;
  purpose: string;
  meetingDate?: string | null;
  status: CaseStatus;
  priority: Priority;
  category?: RequestCategory | null;
  referringOfficer?: ReferringOfficer | null;
  referenceMode?: ReferenceMode | null;
  createdAt: string;
  updatedAt: string;
  citizen: Citizen;
  assignments: Assignment[];
}

export interface CaseDetail extends CaseSummary {
  supportingNotePath?: string | null;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  approvedByUserId?: string | null;
  approvedBy?: UserSummary | null;
  scheduledDate?: string | null;
  scheduledTimeSlot?: string | null;
  meetingType?: MeetingType | null;
  venueOrLink?: string | null;
  visitCheckIn?: VisitCheckIn | null;
  closureStatus?: string | null;
  closureNotes?: string | null;
  meetingSummary?: string | null;
  actionRequired?: string | null;
  responsibleAuthorityId?: string | null;
  resolvedWithoutMeeting?: boolean | null;
  resolutionNotes?: string | null;
  comments: Array<{ id: string; content: string; userId: string; user: UserSummary; createdAt: string }>;
  files: Array<{ id: string; filename: string; path: string; mimetype: string; size: number; createdAt: string }>;
  auditLogs: Array<{ id: string; action: string; details?: string | null; userId?: string | null; user?: UserSummary | null; createdAt: string }>;
  communicationLogs: Array<{ id: string; type: string; direction?: string | null; summary?: string | null; userId: string; user: UserSummary; createdAt: string }>;
}

export interface PaginatedCases {
  data: CaseSummary[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LoginResponse {
  token: string;
  user: UserSummary;
}

// ── Request payloads ─────────────────────────────────────────────────

export interface CreateCaseInput {
  citizenId: string;
  purpose: string;
  meetingDate?: string;
  category?: RequestCategory;
  priority?: Priority;
  referringOfficer: ReferringOfficer;
  referenceMode: ReferenceMode;
  supportingNotePath?: string;
}

export interface ApproveRejectPayload {
  action: "APPROVE" | "REJECT" | "REQUEST_CLARIFICATION" | "RESOLVE_WITHOUT_MEETING";
  rejectionReason?: string;
  resolutionNotes?: string;
}

export interface SchedulePayload {
  scheduledDate: string;
  scheduledTimeSlot: string;
  meetingType: MeetingType;
  venueOrLink?: string;
}

export interface VisitCheckInPayload {
  checkIn: VisitCheckIn;
}

export interface CloseMeetingPayload {
  closureStatus: "COMPLETED" | "FOLLOW_UP_REQUIRED" | "RESCHEDULE_REQUIRED";
  closureNotes?: string;
  meetingSummary?: string;
  actionRequired?: string;
  responsibleAuthorityId?: string;
}

export interface AssignCaseInput {
  userId: string;
  notes?: string;
  priority?: Priority;
  dueDate?: string;
  status?: AssignmentStatus;
}

export interface UpdateAssignmentInput {
  dueDate?: string;
  status?: AssignmentStatus;
  notes?: string;
}

export interface CaseListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: CaseStatus;
  priority?: Priority;
  category?: RequestCategory;
}

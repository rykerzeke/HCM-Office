import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const createCitizenSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10).max(15),
  aadhaar: z.string().length(12).optional().or(z.literal('')),
  address: z.string().optional(),
  districtId: z.string().optional(),
  stateId: z.string().optional(),
});

export const referringOfficerEnum = z.enum(['VISHAL_GUPTA', 'MAHENDRA_PRATAP_SINGH', 'CHIRAG_PANCHAL']);
export const referenceModeEnum = z.enum(['CALL', 'EMAIL', 'WRITTEN', 'IN_PERSON']);

export const requestCategoryEnum = z.enum([
  'PUBLIC_GRIEVANCE', 'POLICY_REQUEST', 'PERSONAL_ISSUE', 'LAND_AND_REVENUE',
  'CIVIC_ISSUE', 'PENSION_AND_WELFARE', 'OTHER'
]);

export const createCaseSchema = z.object({
  citizenId: z.string().uuid(),
  purpose: z.string().min(10),
  meetingDate: z.string().optional(),
  category: requestCategoryEnum.optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  referringOfficer: referringOfficerEnum,
  referenceMode: referenceModeEnum,
  supportingNotePath: z.string().optional(),
});

export const approveRejectSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_CLARIFICATION', 'RESOLVE_WITHOUT_MEETING']),
  rejectionReason: z.string().optional(),
  resolutionNotes: z.string().optional(),
});

export const resolveWithoutMeetingSchema = z.object({
  resolutionNotes: z.string().min(1, 'Resolution notes required'),
});

export const scheduleMeetingSchema = z.object({
  scheduledDate: z.string(), // YYYY-MM-DD
  scheduledTimeSlot: z.string().min(1),
  meetingType: z.enum(['IN_PERSON', 'VIRTUAL']),
  venueOrLink: z.string().optional(),
});

export const visitCheckInSchema = z.object({
  checkIn: z.enum(['ARRIVED', 'NO_SHOW', 'RESCHEDULED']),
});

export const closeMeetingSchema = z.object({
  closureStatus: z.enum(['COMPLETED', 'FOLLOW_UP_REQUIRED', 'RESCHEDULE_REQUIRED']),
  closureNotes: z.string().optional(),
  meetingSummary: z.string().optional(),
  actionRequired: z.string().optional(),
  responsibleAuthorityId: z.string().uuid().optional(),
});

export const assignmentStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'AWAITING_RESPONSE', 'RESOLVED', 'CLOSED']);

export const assignCaseSchema = z.object({
  userId: z.string().uuid(),
  notes: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional(),
  status: assignmentStatusEnum.optional(),
});

export const communicationTypeEnum = z.enum(['CALL', 'LETTER', 'EMAIL', 'MEETING_NOTE']);

export const createCommunicationLogSchema = z.object({
  type: communicationTypeEnum,
  direction: z.enum(['INBOUND', 'OUTBOUND']).optional(),
  summary: z.string().min(1),
});

export const createCommentSchema = z.object({
  content: z.string().min(1),
  imageUrl: z.string().optional()
});

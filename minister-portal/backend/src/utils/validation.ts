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

export const createCaseSchema = z.object({
  citizenId: z.string().uuid(),
  purpose: z.string().min(10),
  meetingDate: z.string().datetime().optional()
});

export const assignCaseSchema = z.object({
  userId: z.string().uuid(),
  notes: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
});

export const createCommentSchema = z.object({
  content: z.string().min(1)
});

"use server";

import { revalidatePath } from "next/cache";
import { apiGet, apiPatch, apiPost } from "@/lib/api-client";
import {
  ApproveRejectPayload,
  CaseDetail,
  CaseListQuery,
  CloseMeetingPayload,
  CreateCaseInput,
  PaginatedCases,
  SchedulePayload,
  VisitCheckInPayload,
} from "@/types/backend";
import { ActionState } from "@/types";

// ── Case Intake ──────────────────────────────────────────────────────

export async function createCaseAction(
  input: CreateCaseInput
): Promise<ActionState> {
  try {
    const data = await apiPost<CaseDetail>("/cases", input);
    revalidatePath("/cases");
    return { status: "success", message: "Case created successfully", data };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create case";
    return { status: "error", message: msg };
  }
}

export async function listCasesAction(
  query: CaseListQuery = {}
): Promise<ActionState> {
  try {
    const params: Record<string, string> = {};
    if (query.page) params.page = String(query.page);
    if (query.limit) params.limit = String(query.limit);
    if (query.search) params.search = query.search;
    if (query.status) params.status = query.status;
    if (query.priority) params.priority = query.priority;
    if (query.category) params.category = query.category;

    const data = await apiGet<PaginatedCases>("/cases", params);
    return { status: "success", message: "Cases retrieved", data };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to list cases";
    return { status: "error", message: msg };
  }
}

export async function getCaseDetailAction(
  id: string
): Promise<ActionState> {
  try {
    const data = await apiGet<CaseDetail>(`/cases/${id}`);
    return { status: "success", message: "Case retrieved", data };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to get case";
    return { status: "error", message: msg };
  }
}

// ── Triage ───────────────────────────────────────────────────────────

export async function authorizeCaseAction(
  id: string,
  body: ApproveRejectPayload
): Promise<ActionState> {
  try {
    const data = await apiPatch<CaseDetail>(`/cases/${id}/authorize`, body);
    revalidatePath("/cases");
    revalidatePath(`/cases/${id}`);
    return { status: "success", message: `Case ${body.action.toLowerCase().replace("_", " ")}d`, data };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to authorize case";
    return { status: "error", message: msg };
  }
}

export async function scheduleCaseAction(
  id: string,
  body: SchedulePayload
): Promise<ActionState> {
  try {
    const data = await apiPatch<CaseDetail>(`/cases/${id}/schedule`, body);
    revalidatePath("/cases");
    revalidatePath(`/cases/${id}`);
    return { status: "success", message: "Case scheduled successfully", data };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to schedule case";
    return { status: "error", message: msg };
  }
}

export async function checkinCaseAction(
  id: string,
  body: VisitCheckInPayload
): Promise<ActionState> {
  try {
    const data = await apiPatch<CaseDetail>(`/cases/${id}/checkin`, body);
    revalidatePath("/cases");
    revalidatePath(`/cases/${id}`);
    return { status: "success", message: `Check-in recorded: ${body.checkIn}`, data };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to check in";
    return { status: "error", message: msg };
  }
}

export async function closeCaseAction(
  id: string,
  body: CloseMeetingPayload
): Promise<ActionState> {
  try {
    const data = await apiPatch<CaseDetail>(`/cases/${id}/close`, body);
    revalidatePath("/cases");
    revalidatePath(`/cases/${id}`);
    return { status: "success", message: "Case closed successfully", data };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to close case";
    return { status: "error", message: msg };
  }
}

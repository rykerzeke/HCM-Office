"use server";

import { revalidatePath } from "next/cache";
import { apiPatch, apiPost } from "@/lib/api-client";
import {
  AssignCaseInput,
  Assignment,
  CaseSummary,
  ManualCaseStatus,
  UpdateAssignmentInput,
} from "@/types/backend";
import { ActionState } from "@/types";

export async function createAssignmentAction(
  caseId: string,
  input: AssignCaseInput
): Promise<ActionState> {
  try {
    const data = await apiPost<Assignment>(
      `/cases/${caseId}/assignments`,
      input
    );
    revalidatePath("/cases");
    revalidatePath(`/cases/${caseId}`);
    return { status: "success", message: "Assignment created", data };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to create assignment";
    return { status: "error", message: msg };
  }
}

export async function updateAssignmentAction(
  caseId: string,
  assignmentId: string,
  input: UpdateAssignmentInput
): Promise<ActionState> {
  try {
    const data = await apiPatch<Assignment>(
      `/cases/${caseId}/assignments/${assignmentId}`,
      input
    );
    revalidatePath("/cases");
    revalidatePath(`/cases/${caseId}`);
    return { status: "success", message: "Assignment updated", data };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to update assignment";
    return { status: "error", message: msg };
  }
}

export async function updateCaseStatusAction(
  caseId: string,
  status: ManualCaseStatus
): Promise<ActionState> {
  try {
    const data = await apiPatch<CaseSummary>(
      `/cases/${caseId}/status`,
      { status }
    );
    revalidatePath("/cases");
    revalidatePath(`/cases/${caseId}`);
    return { status: "success", message: `Status updated to ${status}`, data };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to update status";
    return { status: "error", message: msg };
  }
}

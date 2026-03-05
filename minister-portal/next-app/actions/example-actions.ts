"use server";

import {
  createExample,
  deleteExample,
  getAllExamples,
  getExampleById,
  updateExample,
} from "@/db/queries/example-queries";
import { InsertExample } from "@/db/schema/example-schema";
import { ActionState } from "@/types";
import { revalidatePath } from "next/cache";

export async function createExampleAction(
  data: InsertExample
): Promise<ActionState> {
  try {
    const newExample = await createExample(data);
    revalidatePath("/examples");
    return {
      status: "success",
      message: "Example created successfully",
      data: newExample,
    };
  } catch {
    return { status: "error", message: "Failed to create example" };
  }
}

export async function getExampleByIdAction(
  id: string
): Promise<ActionState> {
  try {
    const example = await getExampleById(id);
    return {
      status: "success",
      message: "Example retrieved successfully",
      data: example,
    };
  } catch {
    return { status: "error", message: "Failed to get example" };
  }
}

export async function getAllExamplesAction(): Promise<ActionState> {
  try {
    const examples = await getAllExamples();
    return {
      status: "success",
      message: "Examples retrieved successfully",
      data: examples,
    };
  } catch {
    return { status: "error", message: "Failed to get examples" };
  }
}

export async function updateExampleAction(
  id: string,
  data: Partial<InsertExample>
): Promise<ActionState> {
  try {
    const updatedExample = await updateExample(id, data);
    revalidatePath("/examples");
    return {
      status: "success",
      message: "Example updated successfully",
      data: updatedExample,
    };
  } catch {
    return { status: "error", message: "Failed to update example" };
  }
}

export async function deleteExampleAction(
  id: string
): Promise<ActionState> {
  try {
    await deleteExample(id);
    revalidatePath("/examples");
    return { status: "success", message: "Example deleted successfully" };
  } catch {
    return { status: "error", message: "Failed to delete example" };
  }
}

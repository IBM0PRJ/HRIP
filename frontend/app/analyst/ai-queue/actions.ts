"use server";
import { confirmAIFlag, dismissAIFlag, executeAIFlagAction } from "../../../lib/api";
import { revalidatePath } from "next/cache";

export async function confirmFlagAction(flagId: string) {
  await confirmAIFlag(flagId, "analyst-auto");
  revalidatePath("/analyst/ai-queue");
}

export async function dismissFlagAction(flagId: string) {
  await dismissAIFlag(flagId, "analyst-auto");
  revalidatePath("/analyst/ai-queue");
}

export async function executeFlagAction(flagId: string, actionType: string, payload: any) {
  await executeAIFlagAction(flagId, "analyst-auto", actionType, payload);
  revalidatePath("/analyst/ai-queue");
}

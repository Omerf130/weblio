"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { setIntentStatus, updateIntentClassification } from "@/lib/data/intents";
import { MANUAL_INTENT_CLASSIFIER_VERSION } from "@/lib/business/intents/rules";
import {
  safeParseSetIntentStatus,
  safeParseUpdateIntentClassification,
} from "@/lib/validations/intent";
import { classifyIntentWithAi } from "@/lib/business/intents/classify-with-ai";
import type { IntentActionState } from "@/lib/business/intents/action-states";

function revalidateIntentPaths(intentId?: string): void {
  revalidatePath("/admin/business/intent");
  if (intentId) {
    revalidatePath(`/admin/business/intent/${intentId}`);
  }
}

export async function classifyIntentWithAiAction(
  intentId: string
): Promise<IntentActionState> {
  await requireAdmin();

  if (typeof intentId !== "string" || !intentId.trim()) {
    return { error: "מזהה רשומה לא תקין." };
  }

  try {
    const result = await classifyIntentWithAi(intentId.trim());

    if (!result.ok) {
      if (result.reason === "not_found") {
        return { error: "רשומה לא נמצאה." };
      }
      if (result.reason === "not_unclassified") {
        return { error: "ניתן לסווג באמצעות AI רק כוונות שלא סווגו." };
      }
      return { error: "סיווג AI נכשל. הרשומה נשארה ללא סיווג." };
    }

    revalidateIntentPaths(result.intent.id);
    return { success: true, intentId: result.intent.id };
  } catch {
    return { error: "סיווג AI נכשל. הרשומה נשארה ללא סיווג." };
  }
}

export async function updateIntentClassificationAction(
  _prevState: IntentActionState,
  formData: FormData
): Promise<IntentActionState> {
  await requireAdmin();

  const parsed = safeParseUpdateIntentClassification({
    intentId: formData.get("intentId"),
    classification: formData.get("classification"),
    classificationReason: formData.get("classificationReason"),
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "נתונים לא תקינים." };
  }

  const payload = {
    ...parsed.data,
    classifierVersion:
      parsed.data.classification === "unclassified"
        ? undefined
        : MANUAL_INTENT_CLASSIFIER_VERSION,
  };

  try {
    const updated = await updateIntentClassification(payload);
    if (!updated) {
      return { error: "רשומה לא נמצאה." };
    }
    revalidateIntentPaths(updated.id);
    return { success: true, intentId: updated.id };
  } catch {
    return { error: "לא ניתן לעדכן את הסיווג כרגע." };
  }
}

export async function setIntentStatusFormAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const intentId = formData.get("intentId");
  const status = formData.get("status");
  const returnTo = formData.get("returnTo");

  if (typeof intentId !== "string" || !intentId) {
    redirect("/admin/business/intent");
  }

  const parsed = safeParseSetIntentStatus({ intentId, status });
  if (!parsed.success) {
    redirect(
      `/admin/business/intent/${intentId}?error=${encodeURIComponent("סטטוס לא תקין.")}`
    );
  }

  try {
    const updated = await setIntentStatus(parsed.data);
    if (!updated) {
      redirect(
        `/admin/business/intent/${intentId}?error=${encodeURIComponent("רשומה לא נמצאה.")}`
      );
    }
    revalidateIntentPaths(updated.id);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_INTENT_STATUS_TRANSITION") {
      redirect(
        `/admin/business/intent/${intentId}?error=${encodeURIComponent("לא ניתן לעדכן לסטטוס זה.")}`
      );
    }
    redirect(
      `/admin/business/intent/${intentId}?error=${encodeURIComponent("לא ניתן לעדכן את הסטטוס כרגע.")}`
    );
  }

  if (typeof returnTo === "string" && returnTo.startsWith("/admin/business/intent")) {
    redirect(returnTo);
  }

  redirect(`/admin/business/intent/${intentId}`);
}

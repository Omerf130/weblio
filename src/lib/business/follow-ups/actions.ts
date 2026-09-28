"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createFollowUp,
  updateFollowUp,
  updateFollowUpStatus,
  deleteFollowUp,
  getFollowUpById,
} from "@/lib/data/follow-ups";
import {
  safeParseCreateFollowUp,
  safeParseEditFollowUp,
  safeParseFollowUpStatus,
} from "@/lib/validations/follow-up";
import type { FollowUpActionState } from "./action-states";

function revalidateFollowUpPaths(options?: {
  leadId?: string;
  opportunityId?: string;
}): void {
  revalidatePath("/admin/business");
  revalidatePath("/admin/business/follow-ups");
  if (options?.leadId) {
    revalidatePath(`/admin/leads/${options.leadId}`);
  }
  if (options?.opportunityId) {
    revalidatePath(`/admin/business/opportunities/${options.opportunityId}`);
  }
}

export async function createFollowUpAction(
  _prevState: FollowUpActionState,
  formData: FormData
): Promise<FollowUpActionState> {
  await requireAdmin();

  const raw = {
    title: formData.get("title"),
    note: formData.get("note"),
    dueAt: formData.get("dueAt"),
    leadId: formData.get("leadId") || undefined,
    opportunityId: formData.get("opportunityId") || undefined,
  };

  const parsed = safeParseCreateFollowUp(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "נתונים לא תקינים." };
  }

  try {
    const created = await createFollowUp(parsed.data);
    revalidateFollowUpPaths({
      leadId: created.leadId,
      opportunityId: created.opportunityId,
    });
    return { success: true };
  } catch {
    return { error: "לא ניתן ליצור מעקב כרגע." };
  }
}

export async function editFollowUpAction(
  _prevState: FollowUpActionState,
  formData: FormData
): Promise<FollowUpActionState> {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "מעקב לא נמצא." };
  }

  const raw = {
    title: formData.get("title"),
    note: formData.get("note"),
    dueAt: formData.get("dueAt"),
  };

  const parsed = safeParseEditFollowUp(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "נתונים לא תקינים." };
  }

  try {
    const updated = await updateFollowUp(id, parsed.data);
    if (!updated) {
      return { error: "מעקב לא נמצא." };
    }
    revalidateFollowUpPaths({
      leadId: updated.leadId,
      opportunityId: updated.opportunityId,
    });
    return { success: true };
  } catch {
    return { error: "לא ניתן לעדכן את המעקב כרגע." };
  }
}

export async function completeFollowUpAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    redirect("/admin/business/follow-ups");
  }

  const existing = await getFollowUpById(id);
  await updateFollowUpStatus(id, "completed");
  revalidateFollowUpPaths({
    leadId: existing?.leadId,
    opportunityId: existing?.opportunityId,
  });
  redirect("/admin/business/follow-ups");
}

export async function cancelFollowUpAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    redirect("/admin/business/follow-ups");
  }

  const existing = await getFollowUpById(id);
  await updateFollowUpStatus(id, "cancelled");
  revalidateFollowUpPaths({
    leadId: existing?.leadId,
    opportunityId: existing?.opportunityId,
  });
  redirect("/admin/business/follow-ups");
}

export async function reopenFollowUpAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    redirect("/admin/business/follow-ups");
  }

  const existing = await getFollowUpById(id);
  await updateFollowUpStatus(id, "pending");
  revalidateFollowUpPaths({
    leadId: existing?.leadId,
    opportunityId: existing?.opportunityId,
  });
  redirect("/admin/business/follow-ups");
}

export async function updateFollowUpStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("id");
  const statusValue = formData.get("status");

  if (typeof id !== "string" || !id) {
    redirect("/admin/business/follow-ups");
  }

  const parsed = safeParseFollowUpStatus(statusValue);
  if (!parsed.success) {
    redirect("/admin/business/follow-ups");
  }

  const existing = await getFollowUpById(id);
  await updateFollowUpStatus(id, parsed.data);
  revalidateFollowUpPaths({
    leadId: existing?.leadId,
    opportunityId: existing?.opportunityId,
  });
  redirect("/admin/business/follow-ups");
}

export async function deleteFollowUpAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    redirect("/admin/business/follow-ups");
  }

  const existing = await getFollowUpById(id);
  await deleteFollowUp(id);
  revalidateFollowUpPaths({
    leadId: existing?.leadId,
    opportunityId: existing?.opportunityId,
  });
  redirect("/admin/business/follow-ups");
}

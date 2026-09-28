"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createOpportunity,
  deleteOpportunity,
  updateOpportunity,
  updateOpportunityStatus,
} from "@/lib/data/opportunities";
import {
  safeParseCreateOpportunity,
  safeParseUpdateOpportunity,
  safeParseUpdateOpportunityStatus,
} from "@/lib/validations/opportunity";
import { convertOpportunityToLead } from "@/lib/data/opportunity-conversion";
import { safeParseConvertOpportunityToLead } from "@/lib/validations/opportunity-conversion";
import type {
  ConvertOpportunityToLeadActionState,
  OpportunityActionState,
} from "@/lib/business/opportunities/action-states";

function revalidateOpportunityPaths(opportunityId?: string): void {
  revalidatePath("/admin/business/opportunities");
  revalidatePath("/admin/business");
  if (opportunityId) {
    revalidatePath(`/admin/business/opportunities/${opportunityId}`);
  }
}

function revalidateAfterConversion(opportunityId: string, leadId: string): void {
  revalidateOpportunityPaths(opportunityId);
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/business/follow-ups");
}

function opportunityInputFromFormData(formData: FormData) {
  return {
    title: formData.get("title"),
    businessName: formData.get("businessName"),
    contactName: formData.get("contactName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    source: formData.get("source"),
    classification: formData.get("classification"),
    sourceUrl: formData.get("sourceUrl"),
    sourcePlatform: formData.get("sourcePlatform"),
    description: formData.get("description"),
    relevanceNote: formData.get("relevanceNote"),
    internalNotes: formData.get("internalNotes"),
  };
}

export async function createOpportunityAction(
  _prevState: OpportunityActionState,
  formData: FormData
): Promise<OpportunityActionState> {
  await requireAdmin();

  const parsed = safeParseCreateOpportunity(opportunityInputFromFormData(formData));
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "נתונים לא תקינים." };
  }

  try {
    const created = await createOpportunity(parsed.data);
    revalidateOpportunityPaths(created.id);
    return { success: true, opportunityId: created.id };
  } catch {
    return { error: "לא ניתן ליצור הזדמנות כרגע." };
  }
}

export async function updateOpportunityAction(
  _prevState: OpportunityActionState,
  formData: FormData
): Promise<OpportunityActionState> {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "הזדמנות לא נמצאה." };
  }

  const parsed = safeParseUpdateOpportunity(opportunityInputFromFormData(formData));
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "נתונים לא תקינים." };
  }

  try {
    const updated = await updateOpportunity(id, parsed.data);
    if (!updated) {
      return { error: "הזדמנות לא נמצאה." };
    }
    revalidateOpportunityPaths(updated.id);
    return { success: true, opportunityId: updated.id };
  } catch (error) {
    if (error instanceof Error && error.message === "OPPORTUNITY_CONVERTED_LOCKED") {
      return { error: "לא ניתן לערוך הזדמנות שהומרה לליד." };
    }
    return { error: "לא ניתן לעדכן את ההזדמנות כרגע." };
  }
}

export async function updateOpportunityStatusAction(
  _prevState: OpportunityActionState,
  formData: FormData
): Promise<OpportunityActionState> {
  await requireAdmin();

  const id = formData.get("id");
  const statusValue = formData.get("status");

  if (typeof id !== "string" || !id) {
    return { error: "הזדמנות לא נמצאה." };
  }

  const parsed = safeParseUpdateOpportunityStatus({ status: statusValue });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "סטטוס לא תקין." };
  }

  try {
    const updated = await updateOpportunityStatus(id, parsed.data.status);
    if (!updated) {
      return { error: "הזדמנות לא נמצאה." };
    }
    revalidateOpportunityPaths(updated.id);
    return { success: true, opportunityId: updated.id };
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_OPPORTUNITY_STATUS_TRANSITION") {
      return { error: "לא ניתן לעדכן לסטטוס זה." };
    }
    return { error: "לא ניתן לעדכן את הסטטוס כרגע." };
  }
}

export async function deleteOpportunityAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    redirect("/admin/business/opportunities");
  }

  try {
    await deleteOpportunity(id);
  } catch (error) {
    if (error instanceof Error && error.message === "OPPORTUNITY_CONVERTED_DELETE_FORBIDDEN") {
      redirect(`/admin/business/opportunities/${id}?error=` + encodeURIComponent("לא ניתן למחוק הזדמנות שהומרה לליד."));
    }
    redirect(`/admin/business/opportunities/${id}?error=` + encodeURIComponent("לא ניתן למחוק את ההזדמנות."));
  }

  revalidateOpportunityPaths();
  redirect("/admin/business/opportunities");
}

/** Plain form action for status buttons (not useActionState). */
export async function setOpportunityStatusFormAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const state = await updateOpportunityStatusAction({}, formData);
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    redirect("/admin/business/opportunities");
  }
  if (state.error) {
    redirect(
      `/admin/business/opportunities/${id}?error=${encodeURIComponent(state.error)}`
    );
  }
  redirect(`/admin/business/opportunities/${id}`);
}

export async function convertOpportunityToLeadAction(
  _prevState: ConvertOpportunityToLeadActionState,
  formData: FormData
): Promise<ConvertOpportunityToLeadActionState> {
  await requireAdmin();

  const parsed = safeParseConvertOpportunityToLead({
    opportunityId: formData.get("opportunityId"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "נתונים לא תקינים." };
  }

  try {
    const lead = await convertOpportunityToLead(parsed.data);
    revalidateAfterConversion(parsed.data.opportunityId, lead.id);
    redirect(`/admin/leads/${lead.id}`);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    if (error instanceof Error) {
      if (error.message === "OPPORTUNITY_NOT_FOUND") {
        return { error: "הזדמנות לא נמצאה." };
      }
      if (error.message === "OPPORTUNITY_ALREADY_CONVERTED") {
        return { error: "הזדמנות זו כבר הומרה לליד." };
      }
    }
    return { error: "לא ניתן להמיר את ההזדמנות כרגע." };
  }

  return {};
}

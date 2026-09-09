"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getBuildYourDreamContent } from "@/lib/content/build-your-dream/get-build-your-dream-content";
import { sendLandingLeadEmails } from "@/lib/email/lead-emails";
import {
  createLandingPageLead,
  createWebsiteLead,
  deleteLead,
  markLeadUnread,
  updateLeadNotes,
  updateLeadQualification,
  updateLeadStatus,
} from "@/lib/data/leads";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createLeadCompletionToken,
  LEAD_COMPLETION_COOKIE,
  verifyLeadCompletionToken,
} from "@/lib/leads/completion-token";
import {
  buildLeadQualificationInputSchema,
  landingPageLeadInputFromFormData,
  leadQualificationInputFromFormData,
  safeParseLandingPageLeadInput,
  safeParseLeadNotes,
  safeParseLeadStatus,
  safeParseWebsiteLeadInput,
  websiteLeadInputFromFormData,
} from "@/lib/validations/lead";
import type {
  LeadActionState,
  LeadNotesActionState,
  QualificationActionState,
} from "@/lib/leads/action-states";

export type {
  LeadActionState,
  LeadNotesActionState,
  QualificationActionState,
};

const GENERIC_PUBLIC_ERROR = "לא ניתן לשלוח את הפנייה כרגע. נסו שוב מאוחר יותר.";
const GENERIC_LANDING_ERROR = "לא ניתן לשלוח את הפרטים כרגע. נסו שוב מאוחר יותר.";

async function setLeadCompletionCookie(leadId: string): Promise<void> {
  const token = createLeadCompletionToken(leadId);
  const cookieStore = await cookies();
  cookieStore.set(LEAD_COMPLETION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/build-your-dream",
  });
}

export async function getLeadIdFromCompletionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(LEAD_COMPLETION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  const verified = verifyLeadCompletionToken(token);
  return verified?.leadId ?? null;
}

function revalidateLeadPaths(id?: string): void {
  revalidatePath("/admin/leads");

  if (id) {
    revalidatePath(`/admin/leads/${id}`);
  }
}

export async function createWebsiteLeadAction(
  _prevState: LeadActionState,
  formData: FormData
): Promise<LeadActionState> {
  const parsed = safeParseWebsiteLeadInput(websiteLeadInputFromFormData(formData));

  if (!parsed.success) {
    return { error: GENERIC_PUBLIC_ERROR };
  }

  try {
    await createWebsiteLead(parsed.data);
    return { success: true };
  } catch {
    return { error: GENERIC_PUBLIC_ERROR };
  }
}

export async function createLandingPageLeadAction(
  _prevState: LeadActionState,
  formData: FormData
): Promise<LeadActionState> {
  const parsed = safeParseLandingPageLeadInput(
    landingPageLeadInputFromFormData(formData)
  );

  if (!parsed.success) {
    return { error: GENERIC_LANDING_ERROR };
  }

  try {
    const lead = await createLandingPageLead(parsed.data);
    await setLeadCompletionCookie(lead.id);

    try {
      await sendLandingLeadEmails(lead);
    } catch (emailError) {
      console.error("[lead-emails] Unexpected error in sendLandingLeadEmails:", emailError);
    }

    redirect("/build-your-dream/thank-you");
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return { error: GENERIC_LANDING_ERROR };
  }
}

export async function saveLeadQualificationAction(
  _prevState: QualificationActionState,
  formData: FormData
): Promise<QualificationActionState> {
  const leadId = await getLeadIdFromCompletionCookie();
  if (!leadId) {
    return { error: "הפגישה פגה. אנא מלאו שוב את הטופס." };
  }

  const content = await getBuildYourDreamContent();
  const questions = content.thankYou.qualification.questions.map((q) => ({
    id: q.id,
    type: q.type,
    question: q.question,
    required: q.required,
  }));

  const raw = leadQualificationInputFromFormData(formData, questions);
  const schema = buildLeadQualificationInputSchema(questions);
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    return { error: content.thankYou.errorMessage };
  }

  const answers = questions
    .map((question) => {
      const answer = parsed.data[question.id as keyof typeof parsed.data];
      if (typeof answer !== "string" || !answer.trim()) {
        return null;
      }
      return {
        key: question.id,
        question: question.question,
        answer: answer.trim(),
      };
    })
    .filter((item): item is { key: string; question: string; answer: string } =>
      Boolean(item)
    );

  const updated = await updateLeadQualification(leadId, answers);
  if (!updated) {
    return { error: content.thankYou.errorMessage };
  }

  revalidateLeadPaths(leadId);
  return { success: true };
}

export async function updateLeadStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("id");
  const statusValue = formData.get("status");

  if (typeof id !== "string" || !id) {
    redirect("/admin/leads?error=" + encodeURIComponent("הפנייה לא נמצאה."));
  }

  const parsedStatus = safeParseLeadStatus(statusValue);
  if (!parsedStatus.success) {
    redirect(
      `/admin/leads/${id}?error=` + encodeURIComponent("סטטוס לא תקין.")
    );
  }

  const updated = await updateLeadStatus(id, parsedStatus.data);
  if (!updated) {
    redirect("/admin/leads?error=" + encodeURIComponent("הפנייה לא נמצאה."));
  }

  revalidateLeadPaths(id);
  redirect(`/admin/leads/${id}`);
}

export async function saveLeadNotesAction(
  _prevState: LeadNotesActionState,
  formData: FormData
): Promise<LeadNotesActionState> {
  await requireAdmin();

  const id = formData.get("id");
  const notesValue = formData.get("internalNotes");

  if (typeof id !== "string" || !id) {
    return { error: "הפנייה לא נמצאה." };
  }

  const parsedNotes = safeParseLeadNotes(notesValue);
  if (!parsedNotes.success) {
    return { error: parsedNotes.error.issues[0]?.message ?? "הערות לא תקינות." };
  }

  const updated = await updateLeadNotes(id, parsedNotes.data);
  if (!updated) {
    return { error: "הפנייה לא נמצאה." };
  }

  revalidateLeadPaths(id);
  return { saved: true };
}

export async function markLeadUnreadAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    redirect("/admin/leads");
  }

  await markLeadUnread(id);
  revalidateLeadPaths(id);
  redirect(`/admin/leads/${id}`);
}

export async function deleteLeadAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    redirect("/admin/leads");
  }

  await deleteLead(id);
  revalidateLeadPaths();
  redirect("/admin/leads");
}

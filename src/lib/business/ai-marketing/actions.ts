"use server";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  formatApplyWebsiteContentValidationError,
  safeParseApplyWebsiteContentInput,
} from "@/lib/business/ai-marketing/apply-website-content-validations";
import { generateMarketingDraft } from "@/lib/business/ai-marketing/generate-marketing-draft";
import type { WebsiteProjectContentFields } from "@/lib/business/ai-marketing/types";
import { safeParseMarketingGenerationInput } from "@/lib/business/ai-marketing/validations";

export type MarketingActionState = {
  error?: string;
  content?: string;
  ideas?: string[];
  websiteContent?: WebsiteProjectContentFields;
};

export type ApplyWebsiteContentActionState = {
  error?: string;
  success?: boolean;
  projectId?: string;
};

export async function generateMarketingDraftAction(
  input: unknown
): Promise<MarketingActionState> {
  await requireAdmin();

  const parsed = safeParseMarketingGenerationInput(input);
  if (!parsed.success) {
    return { error: "נתוני הבקשה אינם תקינים." };
  }

  const result = await generateMarketingDraft(parsed.data);

  if (!result.ok) {
    return { error: result.message };
  }

  if (result.kind === "ideas") {
    return { ideas: result.ideas };
  }

  if (result.kind === "websiteContent") {
    return { websiteContent: result.websiteContent };
  }

  return { content: result.content };
}

export async function applyAiMarketingWebsiteContentAction(
  input: unknown
): Promise<ApplyWebsiteContentActionState> {
  await requireAdmin();

  const parsed = safeParseApplyWebsiteContentInput(input);
  if (!parsed.success) {
    return {
      error: formatApplyWebsiteContentValidationError(parsed.error),
    };
  }

  const { updateProjectWebsiteContentFields } = await import(
    "@/lib/business/ai-marketing/update-project-website-content-fields"
  );

  const result = await updateProjectWebsiteContentFields(
    parsed.data.projectId,
    parsed.data.fields
  );

  if (!result.ok) {
    return { error: result.message };
  }

  return { success: true, projectId: result.projectId };
}

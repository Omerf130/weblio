import type { HubMarketingPurpose, RewriteTransformation } from "@/lib/business/ai-marketing/types";
import type { MarketingGenerationInput } from "@/lib/business/ai-marketing/validations";

export type ProjectContentPurpose = Extract<
  HubMarketingPurpose,
  "socialPost" | "linkedinPost" | "story"
>;

export type ContentSourceMode = "project" | "freeTopic";

export function buildProjectContentPurposeInput(params: {
  purpose: ProjectContentPurpose;
  projectId: string;
  userInstruction?: string;
}): MarketingGenerationInput {
  const instruction = params.userInstruction?.trim();
  return {
    purpose: params.purpose,
    source: "project",
    projectId: params.projectId,
    language: "he",
    userInstruction: instruction || undefined,
  };
}

export function buildFreeTopicContentPurposeInput(params: {
  purpose: ProjectContentPurpose;
  topic: string;
}): MarketingGenerationInput {
  return {
    purpose: params.purpose,
    source: "freeTopic",
    userInstruction: params.topic.trim(),
    language: "he",
  };
}

export function buildWebsiteProjectPurposeInput(params: {
  projectId: string;
  userInstruction?: string;
}): MarketingGenerationInput {
  const instruction = params.userInstruction?.trim();
  return {
    purpose: "websiteProjectContent",
    source: "project",
    projectId: params.projectId,
    language: "he",
    userInstruction: instruction || undefined,
  };
}

export function buildContentIdeasInput(params: {
  mode: "globalWeblio" | "project";
  projectId?: string;
  userInstruction?: string;
}): MarketingGenerationInput {
  const instruction = params.userInstruction?.trim();
  if (params.mode === "project") {
    return {
      purpose: "contentIdeas",
      source: "project",
      projectId: params.projectId!,
      language: "he",
      userInstruction: instruction || undefined,
    };
  }
  return {
    purpose: "contentIdeas",
    source: "globalWeblio",
    language: "he",
    userInstruction: instruction || undefined,
  };
}

export function buildRewritePurposeInput(params: {
  sourceText: string;
  transformation: RewriteTransformation;
  userInstruction?: string;
}): MarketingGenerationInput {
  const instruction = params.userInstruction?.trim();
  return {
    purpose: "rewrite",
    source: "sourceText",
    sourceText: params.sourceText.trim(),
    transformation: params.transformation,
    language: "he",
    userInstruction: instruction || undefined,
  };
}

export function buildFreeformPurposeInput(params: {
  userInstruction: string;
}): MarketingGenerationInput {
  return {
    purpose: "freeform",
    source: "freeTopic",
    userInstruction: params.userInstruction.trim(),
    language: "he",
  };
}

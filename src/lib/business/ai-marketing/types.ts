export const MARKETING_PURPOSES = [
  "websiteProjectContent",
  "socialPost",
  "linkedinPost",
  "story",
  "contentIdeas",
  "rewrite",
  "freeform",
] as const;

export type MarketingPurpose = (typeof MARKETING_PURPOSES)[number];

export const MARKETING_SOURCES = [
  "project",
  "freeTopic",
  "globalWeblio",
  "sourceText",
] as const;

export type MarketingSource = (typeof MARKETING_SOURCES)[number];

/** Purposes exposed in the Phase 6C.2 hub (usable without Coming Soon placeholders). */
export const HUB_MARKETING_PURPOSES = [
  "websiteProjectContent",
  "socialPost",
  "linkedinPost",
  "story",
] as const satisfies readonly MarketingPurpose[];

export type HubMarketingPurpose = (typeof HUB_MARKETING_PURPOSES)[number];

export const REWRITE_TRANSFORMATIONS = [
  "shorter",
  "moreProfessional",
  "morePersonal",
  "strongerCta",
  "clearer",
  "fullRewrite",
] as const;

export type RewriteTransformation = (typeof REWRITE_TRANSFORMATIONS)[number];

export type WebsiteProjectContentFields = {
  title: string;
  subtitle: string;
  description?: string;
  homeTitle?: string;
  homeSubtitle?: string;
  /** Suggested/reviewed tech tags — persisted only via explicit apply. */
  technologies: string[];
};

export type MarketingContentResult = {
  kind: "content";
  content: string;
};

export type MarketingWebsiteContentResult = {
  kind: "websiteContent";
  websiteContent: WebsiteProjectContentFields;
};

export type MarketingIdeasResult = {
  kind: "ideas";
  ideas: string[];
};

export type MarketingGenerationSuccess =
  | MarketingContentResult
  | MarketingWebsiteContentResult
  | MarketingIdeasResult;

export type GenerateMarketingDraftFailureReason =
  | "disabled"
  | "invalid_input"
  | "project_not_found"
  | "generation_failed";

export type GenerateMarketingDraftResult =
  | ({ ok: true } & MarketingGenerationSuccess)
  | { ok: false; reason: GenerateMarketingDraftFailureReason; message: string };

export function marketingInputUsesProjectSource(input: {
  source: MarketingSource;
}): boolean {
  return input.source === "project";
}

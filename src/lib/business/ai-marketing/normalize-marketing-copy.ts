import type {
  MarketingGenerationSuccess,
  WebsiteProjectContentFields,
} from "@/lib/business/ai-marketing/types";

const EM_DASH = "\u2014";
const EN_DASH = "\u2013";

export function normalizeWeblioCopyDashes(value: string): string {
  return value.replaceAll(EM_DASH, "-").replaceAll(EN_DASH, "-");
}

export function normalizeMarketingStringFields(
  values: string[]
): string[] {
  return values.map((item) => normalizeWeblioCopyDashes(item));
}

export function normalizeWebsiteProjectContentFields(
  fields: WebsiteProjectContentFields
): WebsiteProjectContentFields {
  return {
    title: normalizeWeblioCopyDashes(fields.title),
    subtitle: normalizeWeblioCopyDashes(fields.subtitle),
    description: fields.description
      ? normalizeWeblioCopyDashes(fields.description)
      : undefined,
    homeTitle: fields.homeTitle
      ? normalizeWeblioCopyDashes(fields.homeTitle)
      : undefined,
    homeSubtitle: fields.homeSubtitle
      ? normalizeWeblioCopyDashes(fields.homeSubtitle)
      : undefined,
    technologies: normalizeMarketingStringFields(fields.technologies),
  };
}

export function normalizeMarketingGenerationSuccess(
  result: MarketingGenerationSuccess
): MarketingGenerationSuccess {
  if (result.kind === "content") {
    return {
      kind: "content",
      content: normalizeWeblioCopyDashes(result.content),
    };
  }

  if (result.kind === "ideas") {
    return {
      kind: "ideas",
      ideas: normalizeMarketingStringFields(result.ideas),
    };
  }

  return {
    kind: "websiteContent",
    websiteContent: normalizeWebsiteProjectContentFields(result.websiteContent),
  };
}

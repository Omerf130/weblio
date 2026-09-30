import { hostnameMatchesExcludedDomain } from "@/lib/discovery/excluded-discovery-domains";

export const CONTENT_QUALITY_VALUES = ["normal", "aggregated_social"] as const;

export type DiscoveryContentQuality = (typeof CONTENT_QUALITY_VALUES)[number];

export type DiscoveryContentQualityAssessment = {
  quality: DiscoveryContentQuality;
  reasons: string[];
};

export const MAX_CONTENT_QUALITY_REASONS = 5;
export const MAX_CONTENT_QUALITY_REASON_LENGTH = 80;

const FACEBOOK_HOSTS = ["facebook.com", "fb.com"] as const;

export type DiscoveryContentQualityInput = {
  content: string;
  title?: string;
  sourceUrl?: string;
  sourcePlatform?: string;
};

function pushReason(reasons: string[], code: string): void {
  if (reasons.length >= MAX_CONTENT_QUALITY_REASONS) {
    return;
  }
  const trimmed = code.trim().slice(0, MAX_CONTENT_QUALITY_REASON_LENGTH);
  if (trimmed && !reasons.includes(trimmed)) {
    reasons.push(trimmed);
  }
}

/** Facebook / www.facebook.com / m.facebook.com and subdomains. */
export function isFacebookDiscoverySource(input: {
  sourceUrl?: string;
  sourcePlatform?: string;
}): boolean {
  const candidates: string[] = [];
  if (input.sourcePlatform?.trim()) {
    candidates.push(input.sourcePlatform.trim());
  }
  if (input.sourceUrl?.trim()) {
    try {
      candidates.push(new URL(input.sourceUrl.trim()).hostname);
    } catch {
      // ignore invalid URL
    }
  }

  for (const host of candidates) {
    if (hostnameMatchesExcludedDomain(host, FACEBOOK_HOSTS)) {
      return true;
    }
  }
  return false;
}

function countImageMarkers(text: string): number {
  const matches = text.match(/Image \d+/gi);
  return matches?.length ?? 0;
}

function countMarkdownSectionHeadings(text: string): number {
  const matches = text.match(/^#{2,3}\s+/gm);
  return matches?.length ?? 0;
}

function hasOtherPostsSection(text: string): boolean {
  return /other posts/i.test(text);
}

function hasTitlePrefixBlock(text: string): boolean {
  return /^Title:/im.test(text);
}

/**
 * Deterministic aggregate detection (Facebook scope only):
 *
 * Flag `aggregated_social` when the source is Facebook AND any of:
 * 1) "Other posts" section AND at least one "Image <n>" marker
 * 2) Two or more "Image <n>" markers
 * 3) "Other posts" section AND at least two markdown section headings (## / ###)
 * 4) "Other posts" AND "Title:" prefix block (Tavily multi-block extraction)
 *
 * Single weak markers alone (one Image, word Facebook, long text, group URL) do NOT flag.
 */
export function assessDiscoveryContentQuality(
  input: DiscoveryContentQualityInput
): DiscoveryContentQualityAssessment {
  const text = [input.title, input.content].filter(Boolean).join("\n");
  const reasons: string[] = [];

  if (!isFacebookDiscoverySource(input)) {
    return { quality: "normal", reasons: [] };
  }

  const otherPosts = hasOtherPostsSection(text);
  const imageCount = countImageMarkers(text);
  const headingCount = countMarkdownSectionHeadings(text);
  const titlePrefix = hasTitlePrefixBlock(text);

  const rule1 = otherPosts && imageCount >= 1;
  const rule2 = imageCount >= 2;
  const rule3 = otherPosts && headingCount >= 2;
  const rule4 = otherPosts && titlePrefix;

  if (!(rule1 || rule2 || rule3 || rule4)) {
    return { quality: "normal", reasons: [] };
  }

  if (otherPosts) {
    pushReason(reasons, "other_posts_section");
  }
  if (imageCount >= 1) {
    pushReason(reasons, `image_markers:${imageCount}`);
  }
  if (headingCount >= 2) {
    pushReason(reasons, `section_headings:${headingCount}`);
  }
  if (titlePrefix) {
    pushReason(reasons, "title_prefix_block");
  }

  return { quality: "aggregated_social", reasons };
}

export function shouldSkipAutomaticIntentClassification(input: {
  classification: string;
  quality: DiscoveryContentQuality;
}): boolean {
  return input.classification === "unclassified" && input.quality === "aggregated_social";
}

import { normalizeDiscoveryHostname } from "@/lib/discovery/excluded-discovery-domains";
import type { PreIngestCandidate } from "@/lib/discovery/pre-ingest-filter";

export const DISCOVERY_QUALITY_REJECT_REASONS = [
  "unsafe_adult",
  "jobs_careers",
  "non_israel_or_hebrew",
] as const;

export type DiscoveryQualityRejectReason =
  (typeof DISCOVERY_QUALITY_REJECT_REASONS)[number];

export type DiscoveryCandidateQualityDecision =
  | { accepted: true }
  | { accepted: false; reason: DiscoveryQualityRejectReason };

export type DiscoveryQualityGateCounts = {
  rejectedSafety: number;
  rejectedLocale: number;
  rejectedCareers: number;
};

export const MIN_MEANINGFUL_HEBREW_LETTERS = 10;

const SOCIAL_PLATFORMS = [
  "facebook.com",
  "fb.com",
  "instagram.com",
  "reddit.com",
] as const;

const ADULT_HOST_SUBSTRINGS = [
  "beastiality",
  "bestiality",
  "porn",
  "xnxx",
  "xhamster",
  "redtube",
  "xvideos",
  "youporn",
  "onlyfans",
] as const;

const ADULT_HOST_EXACT = new Set(["beastiality.tv"]);

const ADULT_TEXT_PATTERN =
  /\b(porn|xxx|bestiality|beastiality|xhamster|xnxx|onlyfans)\b/i;

/** High-confidence title/snippet signals (e.g. "adult tube"), not single ambiguous words. */
const ADULT_PHRASE_PATTERN =
  /\b(adult\s+tube|tube\s+videos|free\s+adult)\b/i;

const CAREER_URL_PATTERN =
  /(^|\.)careers\.|\/careers(?:\/|$)|\/jobs(?:\/|$)|myworkdayjobs\.com|greenhouse\.io|lever\.co|\.jobs\b/i;

const CAREER_TITLE_PATTERN =
  /\b(careers at|explore careers|job openings|join our team|we(?:'|’)re hiring|now hiring)\b/i;

const HEBREW_EMPLOYMENT_PATTERN =
  /(?:^|[\s,.(])(?:דרושים|משרות|משרה מלאה|הגשת מועמדות|לעבודה ב(?:חברת|צוות))(?:[\s,.!?)]|$)/;

const BUYER_INTENT_PATTERN =
  /מחפש(?:ת|ים)?|שיבנה(?:\s|$)|שיעצב|לעסק(?:\s|\.|,|$)|לפרויקט(?:\s|\.|,|$)|הצע(?:ת)? מחיר/i;

const US_GOV_HOST_PATTERN = /\.(gov|mil)(?:\.|$)/i;

function countHebrewLetters(text: string): number {
  const matches = text.match(/[\u0590-\u05FF]/g);
  return matches?.length ?? 0;
}

function combinedText(input: {
  title?: string;
  content?: string;
  sourceUrl?: string;
}): string {
  return [input.title, input.content, input.sourceUrl].filter(Boolean).join("\n");
}

function hostnameFromUrl(sourceUrl?: string): string | null {
  if (!sourceUrl?.trim()) {
    return null;
  }
  try {
    return normalizeDiscoveryHostname(new URL(sourceUrl.trim()).hostname);
  } catch {
    return null;
  }
}

function isSocialPlatformHost(host: string): boolean {
  return SOCIAL_PLATFORMS.some((entry) => hostnameMatches(host, entry));
}

function hostnameMatches(host: string, pattern: string): boolean {
  const h = normalizeDiscoveryHostname(host);
  const p = normalizeDiscoveryHostname(pattern);
  return h === p || h.endsWith(`.${p}`);
}

function isIsraeliDomainHost(host: string): boolean {
  return host.endsWith(".il") || host.endsWith(".co.il") || host.endsWith(".org.il");
}

function hasIsraelUrlHints(sourceUrl?: string): boolean {
  if (!sourceUrl) {
    return false;
  }
  const lower = sourceUrl.toLowerCase();
  return (
    lower.includes("/he-il") ||
    lower.includes("hl=he") ||
    lower.includes("lang=he")
  );
}

function assessUnsafeAdult(input: {
  title?: string;
  content?: string;
  sourceUrl?: string;
}): boolean {
  const host = hostnameFromUrl(input.sourceUrl);
  if (host) {
    if (ADULT_HOST_EXACT.has(host)) {
      return true;
    }
    for (const fragment of ADULT_HOST_SUBSTRINGS) {
      if (host.includes(fragment)) {
        return true;
      }
    }
  }

  const text = combinedText(input);
  return ADULT_TEXT_PATTERN.test(text) || ADULT_PHRASE_PATTERN.test(text);
}

function assessJobsCareers(input: {
  title?: string;
  content?: string;
  sourceUrl?: string;
}): boolean {
  const text = combinedText(input);
  if (BUYER_INTENT_PATTERN.test(text)) {
    return false;
  }

  const url = input.sourceUrl ?? "";
  if (CAREER_URL_PATTERN.test(url)) {
    return true;
  }

  const title = input.title ?? "";
  if (CAREER_TITLE_PATTERN.test(title)) {
    return true;
  }

  if (HEBREW_EMPLOYMENT_PATTERN.test(text)) {
    return true;
  }

  return false;
}

function assessIsraelHebrewRelevance(input: {
  title?: string;
  content?: string;
  sourceUrl?: string;
}): boolean {
  const text = combinedText(input);
  const hebrewCount = countHebrewLetters(text);
  if (hebrewCount >= MIN_MEANINGFUL_HEBREW_LETTERS) {
    return true;
  }

  const host = hostnameFromUrl(input.sourceUrl);
  if (host && isIsraeliDomainHost(host)) {
    return true;
  }

  if (hasIsraelUrlHints(input.sourceUrl)) {
    return true;
  }

  if (host && isSocialPlatformHost(host) && hebrewCount >= MIN_MEANINGFUL_HEBREW_LETTERS) {
    return true;
  }

  const title = (input.title ?? "").trim();
  const mostlyEnglishTitle =
    title.length >= 24 && countHebrewLetters(title) < MIN_MEANINGFUL_HEBREW_LETTERS;

  if (host && US_GOV_HOST_PATTERN.test(host) && hebrewCount < MIN_MEANINGFUL_HEBREW_LETTERS) {
    return false;
  }

  if (host && host.includes("uschamber") && hebrewCount < MIN_MEANINGFUL_HEBREW_LETTERS) {
    return false;
  }

  if (mostlyEnglishTitle && hebrewCount < MIN_MEANINGFUL_HEBREW_LETTERS && host) {
    if (!isSocialPlatformHost(host) && !isIsraeliDomainHost(host)) {
      return false;
    }
  }

  if (host && isSocialPlatformHost(host) && hebrewCount >= MIN_MEANINGFUL_HEBREW_LETTERS) {
    return true;
  }

  return false;
}

export function evaluateDiscoveryCandidateQuality(
  candidate: PreIngestCandidate
): DiscoveryCandidateQualityDecision {
  const normalized = candidate.normalized;
  const probe = {
    title: normalized.title,
    content: normalized.content,
    sourceUrl: normalized.sourceUrl,
  };

  if (assessUnsafeAdult(probe)) {
    return { accepted: false, reason: "unsafe_adult" };
  }

  if (assessJobsCareers(probe)) {
    return { accepted: false, reason: "jobs_careers" };
  }

  if (!assessIsraelHebrewRelevance(probe)) {
    return { accepted: false, reason: "non_israel_or_hebrew" };
  }

  return { accepted: true };
}

export function emptyDiscoveryQualityGateCounts(): DiscoveryQualityGateCounts {
  return {
    rejectedSafety: 0,
    rejectedLocale: 0,
    rejectedCareers: 0,
  };
}

export function incrementQualityRejectCount(
  counts: DiscoveryQualityGateCounts,
  reason: DiscoveryQualityRejectReason
): void {
  if (reason === "unsafe_adult") {
    counts.rejectedSafety += 1;
  } else if (reason === "jobs_careers") {
    counts.rejectedCareers += 1;
  } else {
    counts.rejectedLocale += 1;
  }
}

export function partitionCandidatesByQualityGate(
  candidates: PreIngestCandidate[]
): { accepted: PreIngestCandidate[]; counts: DiscoveryQualityGateCounts } {
  const counts = emptyDiscoveryQualityGateCounts();
  const accepted: PreIngestCandidate[] = [];

  for (const candidate of candidates) {
    const decision = evaluateDiscoveryCandidateQuality(candidate);
    if (decision.accepted) {
      accepted.push(candidate);
    } else {
      incrementQualityRejectCount(counts, decision.reason);
    }
  }

  return { accepted, counts };
}

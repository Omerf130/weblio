import type { VerificationDomainCategory } from "@/lib/discovery/poc/business-verification/types";

const SOCIAL_SUFFIXES = [
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
];

const DIRECTORY_SUFFIXES = [
  "easy.co.il",
  "d.co.il",
  "tripadvisor.com",
  "tripadvisor.co.il",
  "b144.co.il",
  "zap.co.il",
  /** Israeli service-provider ratings / SpCard listings (PoC electricians). */
  "midrag.co.il",
  /** Curated professional lists e.g. /electricians/haifa (PoC electricians). */
  "pro.co.il",
  /** Business listings portal e.g. /listing/... (PoC beauty). */
  "allbeauty.co.il",
  /** Local business index e.g. /top10/biz/... (PoC beauty). */
  "hkn.co.il",
];

const MARKETPLACE_SUFFIXES = ["wolt.com", "amazon.com", "ebay.com"];

const NEWS_SUFFIXES = [
  "ynet.co.il",
  "walla.co.il",
  "haaretz.co.il",
  "calcalist.co.il",
  "globes.co.il",
  "mako.co.il",
];

const APP_STORE_SUFFIXES = ["apps.apple.com", "play.google.com", "itunes.apple.com"];

/** Appointment / booking SaaS — not an independently owned business website. */
const BOOKING_PLATFORM_SUFFIXES = [
  "kavanu.co",
  "calmark.co.il",
  "timetobook.co.il",
  "fresha.com",
  "booksy.com",
  "booksy.net",
  "simplybook.me",
  "setmore.com",
  "acuityscheduling.com",
];

/** Hosted business profile / mini-site on a platform. */
const BUSINESS_PROFILE_PLATFORM_SUFFIXES = ["lee.co.il", "wixsite.com", "square.site"];

function normalizeHost(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) {
    return "";
  }
  try {
    const url = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return trimmed.replace(/^www\./, "");
  }
}

function hostMatchesSuffix(host: string, suffix: string): boolean {
  return host === suffix || host.endsWith(`.${suffix}`);
}

function hostMatchesAnySuffix(host: string, suffixes: readonly string[]): boolean {
  return suffixes.some((suffix) => hostMatchesSuffix(host, suffix));
}

function isGoogleMapsHost(host: string): boolean {
  return (
    host === "google.com" ||
    host.endsWith(".google.com") ||
    host === "maps.app.goo.gl" ||
    host.endsWith(".goo.gl")
  );
}

function looksLikeOwnedBusinessSite(host: string): boolean {
  if (!host || host.includes("google") || host.split(".").length < 2) {
    return false;
  }
  return /\.(co\.il|com|net|org|biz|info)$/i.test(host);
}

export function extractHostname(urlOrHost: string | undefined): string | undefined {
  const host = normalizeHost(urlOrHost ?? "");
  return host.length > 0 ? host : undefined;
}

export function classifyVerificationDomain(
  urlOrHost: string | undefined
): VerificationDomainCategory {
  const host = normalizeHost(urlOrHost ?? "");
  if (!host) {
    return "unknown";
  }

  if (hostMatchesAnySuffix(host, SOCIAL_SUFFIXES)) {
    return "social";
  }

  if (isGoogleMapsHost(host)) {
    return "directory";
  }

  if (hostMatchesAnySuffix(host, APP_STORE_SUFFIXES)) {
    return "appStore";
  }

  if (hostMatchesAnySuffix(host, DIRECTORY_SUFFIXES)) {
    return "directory";
  }

  if (hostMatchesAnySuffix(host, MARKETPLACE_SUFFIXES) || host.startsWith("wolt.")) {
    return "marketplace";
  }

  if (hostMatchesAnySuffix(host, NEWS_SUFFIXES)) {
    return "news";
  }

  if (hostMatchesAnySuffix(host, BOOKING_PLATFORM_SUFFIXES)) {
    return "bookingPlatform";
  }

  if (hostMatchesAnySuffix(host, BUSINESS_PROFILE_PLATFORM_SUFFIXES)) {
    return "businessProfilePlatform";
  }

  if (looksLikeOwnedBusinessSite(host)) {
    return "possibleOfficial";
  }

  return "unknown";
}

export function isIndependentOfficialDomainCategory(
  category: VerificationDomainCategory
): boolean {
  return category === "possibleOfficial";
}

export const VERIFICATION_DOMAIN_LISTS = {
  socialSuffixes: SOCIAL_SUFFIXES,
  directorySuffixes: DIRECTORY_SUFFIXES,
  marketplaceSuffixes: MARKETPLACE_SUFFIXES,
  newsSuffixes: NEWS_SUFFIXES,
  appStoreSuffixes: APP_STORE_SUFFIXES,
  bookingPlatformSuffixes: BOOKING_PLATFORM_SUFFIXES,
  businessProfilePlatformSuffixes: BUSINESS_PROFILE_PLATFORM_SUFFIXES,
} as const;

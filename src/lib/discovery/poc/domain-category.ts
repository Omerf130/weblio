export type PocDomainCategory =
  | "social"
  | "forum/community"
  | "video"
  | "service/business-site"
  | "other";

const SOCIAL_HOSTS = new Set([
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "instagram.com",
  "www.instagram.com",
  "twitter.com",
  "x.com",
  "www.x.com",
  "tiktok.com",
  "www.tiktok.com",
  "linkedin.com",
  "www.linkedin.com",
]);

const VIDEO_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "vimeo.com",
  "www.vimeo.com",
]);

const FORUM_HOSTS = new Set([
  "reddit.com",
  "www.reddit.com",
  "old.reddit.com",
  "fxp.co.il",
  "www.fxp.co.il",
  "tapatalk.com",
  "www.tapatalk.com",
  "discourse.org",
]);

const SERVICE_DOMAIN_PATTERN =
  /(^|\.)((web|seo|digital|design|studio|agency|marketing|dev|developer|wordpress|wix)([.-]|$))/i;

function normalizeHost(domainOrUrl: string): string {
  const trimmed = domainOrUrl.trim().toLowerCase();
  if (!trimmed) {
    return "";
  }
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return new URL(trimmed).hostname.toLowerCase();
    }
  } catch {
    // fall through
  }
  return trimmed.replace(/^www\./, "");
}

function hostMatchesSet(host: string, hosts: Set<string>): boolean {
  if (hosts.has(host)) {
    return true;
  }
  const bare = host.replace(/^www\./, "");
  return hosts.has(bare) || hosts.has(`www.${bare}`);
}

function looksLikeForumHost(host: string): boolean {
  if (hostMatchesSet(host, FORUM_HOSTS)) {
    return true;
  }
  return (
    host.includes("forum") ||
    host.includes("community") ||
    host.endsWith(".forum") ||
    host.startsWith("forum.")
  );
}

export function categorizePocDomain(domainOrUrl: string | undefined): PocDomainCategory {
  const host = normalizeHost(domainOrUrl ?? "");
  if (!host) {
    return "other";
  }

  if (hostMatchesSet(host, SOCIAL_HOSTS)) {
    return "social";
  }

  if (hostMatchesSet(host, VIDEO_HOSTS)) {
    return "video";
  }

  if (looksLikeForumHost(host)) {
    return "forum/community";
  }

  if (SERVICE_DOMAIN_PATTERN.test(host)) {
    return "service/business-site";
  }

  return "other";
}

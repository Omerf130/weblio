import { WEBSITE_CHECK_CACHE_TTL_MS } from "@/lib/website-check/constants";

const BASE_LINE = "התוצאות מבוססות על בדיקה קודמת.";

function formatHebrewDateTime(date: Date): string {
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Public copy when a prior analysis is shown from cache (no new PSI run).
 * Uses completedAt + TTL so users see when a fresh check becomes available.
 */
export function buildWebsiteCheckCachedResultsPublicMessage(
  completedAtIso: string | undefined,
  now: Date = new Date()
): string {
  if (!completedAtIso?.trim()) {
    return `${BASE_LINE} בדיקה חדשה תהיה זמינה בהמשך.`;
  }

  const completedAt = new Date(completedAtIso);
  if (Number.isNaN(completedAt.getTime())) {
    return BASE_LINE;
  }

  const freshAvailableAt = new Date(completedAt.getTime() + WEBSITE_CHECK_CACHE_TTL_MS);
  if (freshAvailableAt.getTime() <= now.getTime()) {
    return BASE_LINE;
  }

  return `${BASE_LINE} בדיקה חדשה תהיה זמינה מ-${formatHebrewDateTime(freshAvailableAt)}.`;
}

export const WEBSITE_CHECK_CACHE_REPLAY_STATUS_LABEL = "תוצאות מבוססות על בדיקה קודמת";

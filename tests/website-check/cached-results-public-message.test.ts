import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { WEBSITE_CHECK_CACHE_TTL_MS } from "../../src/lib/website-check/constants";
import { buildWebsiteCheckCachedResultsPublicMessage } from "../../src/lib/website-check/cached-results-public-message";

describe("buildWebsiteCheckCachedResultsPublicMessage", () => {
  it("states prior results and when a fresh check becomes available", () => {
    const completedAt = "2026-03-20T10:00:00.000Z";
    const now = new Date("2026-03-20T14:00:00.000Z");
    const message = buildWebsiteCheckCachedResultsPublicMessage(completedAt, now);

    assert.match(message, /התוצאות מבוססות על בדיקה קודמת/);
    assert.doesNotMatch(message, /מטמון|PageSpeed/);

    const expiresAt = new Date(new Date(completedAt).getTime() + WEBSITE_CHECK_CACHE_TTL_MS);
    const expectedFragment = new Intl.DateTimeFormat("he-IL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(expiresAt);
    assert.match(message, new RegExp(expectedFragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });

  it("does not imply a full 24-hour wait when part of the TTL has elapsed", () => {
    const completedAt = "2026-03-20T10:00:00.000Z";
    const now = new Date("2026-03-21T08:00:00.000Z");
    const message = buildWebsiteCheckCachedResultsPublicMessage(completedAt, now);
    assert.doesNotMatch(message, /לאחר 24 שעות/);
  });
});

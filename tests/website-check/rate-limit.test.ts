import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateRateLimitIncrement,
  incrementRateLimitCounters,
  nextRateLimitCounters,
} from "../../src/lib/website-check/rate-limit";
import { WEBSITE_CHECK_RATE_LIMIT_PER_DAY, WEBSITE_CHECK_RATE_LIMIT_PER_HOUR } from "../../src/lib/website-check/constants";

describe("website check rate limit counters", () => {
  it("resets hour bucket on hour change", () => {
    const now = new Date("2026-03-20T11:30:00.000Z");
    const nextHour = new Date("2026-03-20T12:05:00.000Z");
    const current = nextRateLimitCounters(
      { hourBucket: "2026032011", hourCount: 3, dayBucket: "20260320", dayCount: 3 },
      now
    );
    assert.equal(current.hourCount, 3);

    const rolled = nextRateLimitCounters(current, nextHour);
    assert.equal(rolled.hourCount, 0);
    assert.equal(rolled.dayCount, 3);
  });

  it("blocks when hour limit reached", () => {
    const counters = incrementRateLimitCounters({
      hourBucket: "2026032011",
      hourCount: WEBSITE_CHECK_RATE_LIMIT_PER_HOUR,
      dayBucket: "20260320",
      dayCount: 1,
    });
    assert.equal(evaluateRateLimitIncrement(counters), "hour");
  });

  it("blocks when day limit reached", () => {
    const counters = incrementRateLimitCounters({
      hourBucket: "2026032011",
      hourCount: 0,
      dayBucket: "20260320",
      dayCount: WEBSITE_CHECK_RATE_LIMIT_PER_DAY,
    });
    assert.equal(evaluateRateLimitIncrement(counters), "day");
  });
});

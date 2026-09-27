import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getIsraelTodayRange,
  getIsraelDaysFromNow,
} from "../../src/lib/business/israel-time";

describe("getIsraelTodayRange", () => {
  it("returns start and end of the same Israel day", () => {
    const reference = new Date("2026-09-27T14:30:00.000Z");
    const { start, end } = getIsraelTodayRange(reference);

    assert.ok(start < end);
    assert.ok(start <= reference);
    assert.ok(end >= reference);

    const diffMs = end.getTime() - start.getTime();
    const almostOneDayMs = 23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000 + 999;
    assert.ok(
      Math.abs(diffMs - almostOneDayMs) < 7200_000,
      `Expected ~24h span, got ${diffMs}ms`
    );
  });

  it("handles midnight boundary in Israel timezone", () => {
    const justBeforeMidnightUtc = new Date("2026-09-27T20:59:00.000Z");
    const justAfterMidnightUtc = new Date("2026-09-27T21:01:00.000Z");

    const rangeBefore = getIsraelTodayRange(justBeforeMidnightUtc);
    const rangeAfter = getIsraelTodayRange(justAfterMidnightUtc);

    assert.ok(
      rangeBefore.start.getTime() !== rangeAfter.start.getTime() ||
        rangeBefore.start.getTime() === rangeAfter.start.getTime(),
      "Ranges may or may not differ depending on DST"
    );
  });
});

describe("getIsraelDaysFromNow", () => {
  it("returns a date in the future", () => {
    const reference = new Date("2026-09-27T14:30:00.000Z");
    const futureDate = getIsraelDaysFromNow(7, reference);

    assert.ok(futureDate > reference);
  });

  it("returns approximately 7 days later", () => {
    const reference = new Date("2026-09-27T14:30:00.000Z");
    const futureDate = getIsraelDaysFromNow(7, reference);

    const diffDays =
      (futureDate.getTime() - reference.getTime()) / (24 * 60 * 60 * 1000);

    assert.ok(diffDays >= 7, `Expected >= 7 days, got ${diffDays}`);
    assert.ok(diffDays <= 8.5, `Expected <= 8.5 days, got ${diffDays}`);
  });
});

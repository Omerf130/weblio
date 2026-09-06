import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aggregateCountsByDate,
  aggregateSourceCounts,
  buildDailyLeadSeries,
  buildSourceBreakdown,
  calculatePercentChange,
  formatComparisonLabel,
} from "../../src/lib/admin/dashboard-stats";

describe("dashboard stats", () => {
  it("builds a 30-day lead series with zero-filled days", () => {
    const reference = new Date("2026-03-15T10:00:00.000Z");
    const series = buildDailyLeadSeries(
      {
        "2026-03-14": 2,
        "2026-03-15": 1,
      },
      reference,
      30
    );

    assert.equal(series.length, 30);
    assert.equal(series.at(-1)?.count, 1);
    assert.equal(series.at(-2)?.count, 2);
    assert.equal(series[0]?.count, 0);
  });

  it("aggregates counts by date and source", () => {
    assert.deepEqual(
      aggregateCountsByDate([
        { _id: "2026-03-01", count: 3 },
        { _id: "2026-03-02", count: 1 },
      ]),
      {
        "2026-03-01": 3,
        "2026-03-02": 1,
      }
    );

    assert.deepEqual(
      aggregateSourceCounts([
        { _id: "website", count: 4 },
        { _id: "landingPage", count: 2 },
      ]),
      {
        website: 4,
        landingPage: 2,
      }
    );
  });

  it("builds source breakdown labels from real lead sources", () => {
    const breakdown = buildSourceBreakdown({
      website: 5,
      landingPage: 0,
    });

    assert.equal(breakdown.length, 1);
    assert.equal(breakdown[0]?.label, "אתר");
    assert.equal(breakdown[0]?.count, 5);
  });

  it("calculates percent change only when previous period has data", () => {
    assert.equal(calculatePercentChange(12, 0), null);
    assert.deepEqual(calculatePercentChange(12, 10), {
      percentChange: 20,
      direction: "up",
    });
    assert.deepEqual(calculatePercentChange(8, 10), {
      percentChange: 20,
      direction: "down",
    });
    assert.equal(formatComparisonLabel(calculatePercentChange(10, 10)), "ללא שינוי לעומת התקופה הקודמת");
  });
});

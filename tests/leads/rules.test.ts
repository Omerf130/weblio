import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatLeadNumber,
  getLeadEmptyStateMessage,
  hasUtmData,
  matchesLeadSearch,
  parseLeadSourceFilter,
  shouldSetLastContactAt,
} from "../../src/lib/leads/rules";

describe("lead rules", () => {
  it("parses source filters", () => {
    assert.equal(parseLeadSourceFilter(undefined), "all");
    assert.equal(parseLeadSourceFilter("website"), "website");
    assert.equal(parseLeadSourceFilter("landingPage"), "landingPage");
    assert.equal(parseLeadSourceFilter("invalid"), "all");
  });

  it("matches search by name, email, phone, and lead number", () => {
    const lead = {
      leadNumber: 1001,
      name: "ישראל ישראלי",
      phone: "054-4993155",
      email: "test@example.com",
    };

    assert.equal(matchesLeadSearch(lead, "ישראל"), true);
    assert.equal(matchesLeadSearch(lead, "test@example.com"), true);
    assert.equal(matchesLeadSearch(lead, "054499"), true);
    assert.equal(matchesLeadSearch(lead, "1001"), true);
    assert.equal(matchesLeadSearch(lead, "unknown"), false);
  });

  it("formats lead numbers for admin display", () => {
    assert.equal(formatLeadNumber(1001), "ליד #1001");
  });

  it("returns source-specific empty states", () => {
    assert.match(getLeadEmptyStateMessage("website"), /אתר/);
    assert.match(getLeadEmptyStateMessage("landingPage"), /דפי נחיתה/);
  });

  it("detects utm data only when values exist", () => {
    assert.equal(hasUtmData({}), false);
    assert.equal(hasUtmData({ utm_source: "google" }), true);
  });
});

describe("last contact rules", () => {
  it("sets lastContactAt only when status becomes contacted", () => {
    assert.equal(shouldSetLastContactAt("contacted"), true);
    assert.equal(shouldSetLastContactAt("contacted", "new"), true);
    assert.equal(shouldSetLastContactAt("contacted", "contacted"), false);
    assert.equal(shouldSetLastContactAt("closed"), false);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CATALOGUED_LIGHTHOUSE_AUDIT_IDS,
  resolveHebrewAuditExplanation,
} from "../../src/lib/website-check/lighthouse-audit-hebrew-catalog";
import type { WebsiteCheckFinding } from "../../src/views/website-check/website-check-results-content";

function baseFinding(overrides: Partial<WebsiteCheckFinding>): WebsiteCheckFinding {
  return {
    id: "x",
    status: "warning",
    title: "English title",
    summary: "English summary",
    details: "English details",
    ...overrides,
  };
}

describe("lighthouse-audit-hebrew-catalog", () => {
  it("includes expected stable audit IDs", () => {
    for (const id of [
      "canonical",
      "robots-txt",
      "largest-contentful-paint",
      "unused-javascript",
      "color-contrast",
      "viewport",
    ]) {
      assert.ok(CATALOGUED_LIGHTHOUSE_AUDIT_IDS.includes(id), id);
    }
  });

  it("resolves unused-javascript when score evidence exists", () => {
    const entry = resolveHebrewAuditExplanation(
      baseFinding({
        auditId: "unused-javascript",
        auditKind: "opportunity",
        status: "warning",
        score: 0.4,
      })
    );
    assert.ok(entry);
    assert.match(entry!.titleHe, /קוד/);
  });

  it("does not resolve unknown audit IDs", () => {
    const entry = resolveHebrewAuditExplanation(
      baseFinding({
        auditId: "totally-made-up-audit",
        auditKind: "failure",
        status: "failed",
      })
    );
    assert.equal(entry, null);
  });

  it("does not resolve color-contrast without failure kind", () => {
    const entry = resolveHebrewAuditExplanation(
      baseFinding({
        auditId: "color-contrast",
        auditKind: "diagnostic",
        status: "neutral",
      })
    );
    assert.equal(entry, null);
  });

  it("requires measurement for LCP opportunities without display or score", () => {
    const entry = resolveHebrewAuditExplanation(
      baseFinding({
        auditId: "largest-contentful-paint",
        auditKind: "opportunity",
        status: "warning",
      })
    );
    assert.equal(entry, null);
  });
});

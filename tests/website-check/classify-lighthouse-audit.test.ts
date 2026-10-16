import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyLighthouseAudit } from "../../src/lib/website-check/psi/classify-lighthouse-audit";
import type { PsiAudit } from "../../src/lib/website-check/psi/pagespeed-response-types";

function audit(overrides: Partial<PsiAudit> = {}): PsiAudit {
  return {
    title: "Test audit",
    ...overrides,
  };
}

describe("classifyLighthouseAudit", () => {
  it("marks opportunities as warning/opportunity not failure", () => {
    const result = classifyLighthouseAudit(
      audit({
        score: 0.2,
        scoreDisplayMode: "numeric",
        details: { type: "opportunity" },
      })
    );
    assert.equal(result.auditKind, "opportunity");
    assert.equal(result.status, "warning");
  });

  it("marks binary failures as failure", () => {
    const result = classifyLighthouseAudit(
      audit({ score: 0, scoreDisplayMode: "binary" })
    );
    assert.equal(result.auditKind, "failure");
    assert.equal(result.status, "failed");
  });

  it("marks informative audits as diagnostic", () => {
    const result = classifyLighthouseAudit(
      audit({ scoreDisplayMode: "informative", score: null })
    );
    assert.equal(result.auditKind, "diagnostic");
    assert.equal(result.status, "neutral");
  });

  it("marks high numeric scores as passed", () => {
    const result = classifyLighthouseAudit(
      audit({ score: 1, scoreDisplayMode: "numeric" })
    );
    assert.equal(result.auditKind, "passed");
    assert.equal(result.status, "positive");
  });
});

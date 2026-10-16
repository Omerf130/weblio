import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildGenericBusinessFinding,
  selectPrioritizedBusinessFindings,
} from "../../src/lib/website-check/business-report";
import type { WebsiteCheckFinding } from "../../src/views/website-check/website-check-results-content";

function finding(partial: Partial<WebsiteCheckFinding>): WebsiteCheckFinding {
  return {
    id: partial.id ?? "f",
    status: partial.status ?? "failed",
    title: partial.title ?? "T",
    summary: partial.summary ?? "S",
    details: partial.details ?? "D",
    ...partial,
  };
}

describe("business-report prioritization", () => {
  it("prefers SEO configuration failures over performance opportunities", () => {
    const selected = selectPrioritizedBusinessFindings(
      [
        finding({
          id: "perf",
          auditId: "unused-javascript",
          auditKind: "opportunity",
          status: "warning",
          category: "performance",
          score: 0.3,
        }),
        finding({
          id: "seo",
          auditId: "document-title",
          auditKind: "failure",
          status: "failed",
          category: "seo",
        }),
      ],
      3
    );
    assert.equal(selected.length, 2);
    assert.equal(selected[0].auditId, "document-title");
    assert.ok(selected[0].catalogMatched);
  });

  it("excludes unknown audits from verified business list", () => {
    const selected = selectPrioritizedBusinessFindings(
      [
        finding({
          id: "unknown",
          auditId: "some-unknown-audit",
          auditKind: "failure",
          status: "failed",
        }),
      ],
      5
    );
    assert.equal(selected.length, 0);
  });

  it("generic fallback does not invent Hebrew titles for unknown audits", () => {
    const generic = buildGenericBusinessFinding(
      finding({ auditId: "unknown-audit", auditKind: "failure" })
    );
    assert.equal(generic.catalogMatched, false);
    assert.match(generic.whatWeFound, /לא קיים הסבר עסקי/);
  });

  it("returns fewer than five when not enough verified findings", () => {
    const selected = selectPrioritizedBusinessFindings(
      [
        finding({
          id: "a11y",
          auditId: "color-contrast",
          auditKind: "failure",
          status: "failed",
          category: "accessibility",
        }),
      ],
      5
    );
    assert.equal(selected.length, 1);
  });
});

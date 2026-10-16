import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { WebsiteCheckAiPromptInput } from "../../src/lib/website-check/ai/build-website-check-ai-input";
import {
  toWebsiteCheckAiRecommendations,
  validateWebsiteCheckAiModelOutput,
} from "../../src/lib/website-check/ai/validate-website-check-ai-output";

const sampleInput: WebsiteCheckAiPromptInput = {
  scores: { performance: 55, seo: 90, accessibility: 88, ux: 92, overall: 78 },
  findings: [
    {
      auditId: "largest-contentful-paint",
      category: "performance",
      auditKind: "opportunity",
      status: "warning",
      displayValue: "12.9 s",
    },
  ],
};

describe("validateWebsiteCheckAiModelOutput", () => {
  it("accepts recommendations with valid audit IDs and metrics", () => {
    const validated = validateWebsiteCheckAiModelOutput(
      {
        recommendations: [
          {
            title: "האתר נטען לאט",
            explanation: "בבדיקה נמצא עיכוב בטעינת התוכן המרכזי.",
            action: "כדאי לבקש ממפתח לבדוק תמונות כבדות.",
            auditIds: ["largest-contentful-paint"],
            optionalMetric: "12.9 s",
          },
        ],
      },
      sampleInput
    );

    assert.ok(validated);
    const recs = toWebsiteCheckAiRecommendations(validated!);
    assert.equal(recs.length, 1);
    assert.equal(recs[0]?.auditIds[0], "largest-contentful-paint");
  });

  it("rejects fabricated audit IDs", () => {
    const validated = validateWebsiteCheckAiModelOutput(
      {
        recommendations: [
          {
            title: "בעיה",
            explanation: "הסבר",
            action: "צעד",
            auditIds: ["made-up-audit"],
          },
        ],
      },
      sampleInput
    );
    assert.equal(validated, null);
  });

  it("rejects unsupported optional metrics", () => {
    const validated = validateWebsiteCheckAiModelOutput(
      {
        recommendations: [
          {
            title: "בעיה",
            explanation: "הסבר",
            action: "צעד",
            auditIds: ["largest-contentful-paint"],
            optionalMetric: "99 s",
          },
        ],
      },
      sampleInput
    );
    assert.equal(validated, null);
  });

  it("allows positive summary without recommendations", () => {
    const validated = validateWebsiteCheckAiModelOutput(
      { recommendations: [], positiveSummary: "האתר נראה תקין בבדיקה האוטומטית." },
      sampleInput
    );
    assert.ok(validated);
  });
});

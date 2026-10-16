import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toPublicWebsiteAnalysisRunDto } from "../../src/lib/website-check/public-run-dto";
import { __testHelpers } from "../../src/lib/website-check/api/post-website-check-run";

describe("toPublicWebsiteAnalysisRunDto", () => {
  it("strips internal fieldData payload and urlHash", () => {
    const dto = toPublicWebsiteAnalysisRunDto(
      __testHelpers.sampleRun({
        fieldData: {
          available: true,
          metrics: [{ id: "LCP", percentile: 1000, category: "FAST" }],
          payload: { secret: true },
        },
      })
    );

    assert.equal(dto.url, "https://example.com/");
    assert.equal("urlHash" in dto, false);
    assert.equal(dto.fieldData?.available, true);
    assert.equal(dto.fieldData && "payload" in dto.fieldData, false);
  });

  it("exposes ai insights without internal source or secrets", () => {
    const dto = toPublicWebsiteAnalysisRunDto(
      __testHelpers.sampleRun({
        aiInsights: {
          status: "completed",
          source: "openai",
          recommendations: [
            {
              id: "ai-1",
              title: "כותרת",
              explanation: "הסבר",
              action: "צעד",
              auditIds: ["lcp"],
            },
          ],
          positiveSummary: null,
          updatedAt: new Date().toISOString(),
        },
      })
    );

    assert.equal(dto.aiInsights?.status, "completed");
    assert.equal(dto.aiInsights?.recommendations.length, 1);
    assert.equal(dto.aiInsights && "source" in dto.aiInsights, false);
  });
});

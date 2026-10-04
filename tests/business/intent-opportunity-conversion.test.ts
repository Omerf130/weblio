import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  canConvertIntentToOpportunity,
  getIntentConversionBlockReason,
} from "../../src/lib/business/intents/intent-conversion-eligibility";
import {
  deriveOpportunityTitleFromIntent,
  mapIntentToOpportunityFields,
  OPPORTUNITY_DESCRIPTION_MAX,
  OPPORTUNITY_TITLE_MAX,
} from "../../src/lib/business/intents/intent-opportunity-mapping";
import { parseIntentStatusFilter } from "../../src/lib/business/intents/list-url";
import { safeParseConvertIntentToOpportunity } from "../../src/lib/validations/intent-opportunity-conversion";

const VALID_INTENT_ID = "507f1f77bcf86cd799439011";

function baseIntent(overrides: Record<string, unknown> = {}) {
  return {
    id: VALID_INTENT_ID,
    content: "מחפש בונה אתרים לעסק קטן",
    classification: "explicitNeed" as const,
    status: "new" as const,
    provider: "dev",
    ...overrides,
  };
}

describe("intent conversion eligibility", () => {
  it("allows new explicitNeed", () => {
    assert.equal(
      canConvertIntentToOpportunity({
        status: "new",
        classification: "explicitNeed",
      }),
      true
    );
  });

  it("allows new possibleNeed", () => {
    assert.equal(
      canConvertIntentToOpportunity({
        status: "new",
        classification: "possibleNeed",
      }),
      true
    );
  });

  it("blocks unclassified", () => {
    assert.equal(
      getIntentConversionBlockReason({
        status: "new",
        classification: "unclassified",
      }),
      "not_convertible_classification"
    );
  });

  it("blocks irrelevant", () => {
    assert.equal(
      getIntentConversionBlockReason({
        status: "new",
        classification: "irrelevant",
      }),
      "not_convertible_classification"
    );
  });

  it("blocks dismissed", () => {
    assert.equal(
      getIntentConversionBlockReason({
        status: "dismissed",
        classification: "explicitNeed",
      }),
      "not_new"
    );
  });

  it("blocks saved and existing opportunityId", () => {
    assert.equal(
      getIntentConversionBlockReason({
        status: "saved",
        classification: "explicitNeed",
      }),
      "already_converted"
    );
    assert.equal(
      getIntentConversionBlockReason({
        status: "new",
        classification: "explicitNeed",
        opportunityId: VALID_INTENT_ID,
      }),
      "already_converted"
    );
  });
});

describe("intent to opportunity mapping", () => {
  it("maps explicitNeed with source intent and intentId", () => {
    const mapped = mapIntentToOpportunityFields(
      baseIntent({
        title: "שאלה בקבוצה",
        classificationReason: "בקשה ברורה",
        sourcePlatform: "facebook",
        sourceUrl: "https://example.com/post/1",
        externalId: "ext-1",
      })
    );

    assert.equal(mapped.title, "שאלה בקבוצה");
    assert.equal(mapped.source, "intent");
    assert.equal(mapped.classification, "explicitNeed");
    assert.equal(mapped.description, "מחפש בונה אתרים לעסק קטן");
    assert.equal(mapped.relevanceNote, "בקשה ברורה");
    assert.equal(mapped.sourcePlatform, "facebook");
    assert.equal(mapped.sourceUrl, "https://example.com/post/1");
    assert.equal(mapped.externalSourceId, "ext-1");
    assert.equal(mapped.intentId, VALID_INTENT_ID);
    assert.equal(mapped.status, "new");
    assert.equal(mapped.internalNotes, "");
    assert.equal(mapped.internalNotes.includes("/admin/"), false);
  });

  it("derives title from content when title missing", () => {
    const title = deriveOpportunityTitleFromIntent(
      baseIntent({ title: undefined, content: "שורה ראשונה\nשורה שנייה" })
    );
    assert.equal(title, "שורה ראשונה");
  });

  it("truncates long content for description", () => {
    const mapped = mapIntentToOpportunityFields(
      baseIntent({ content: "א".repeat(OPPORTUNITY_DESCRIPTION_MAX + 20) })
    );
    assert.equal(mapped.description.length, OPPORTUNITY_DESCRIPTION_MAX);
    assert.ok(mapped.description.endsWith("…"));
  });

  it("truncates long title", () => {
    const mapped = mapIntentToOpportunityFields(
      baseIntent({ title: "ב".repeat(OPPORTUNITY_TITLE_MAX + 10) })
    );
    assert.equal(mapped.title.length, OPPORTUNITY_TITLE_MAX);
  });

  it("omits non-https sourceUrl", () => {
    const mapped = mapIntentToOpportunityFields(
      baseIntent({ sourceUrl: "http://insecure.example.com" })
    );
    assert.equal(mapped.sourceUrl, undefined);
  });
});

describe("convert intent validation", () => {
  it("accepts valid intentId", () => {
    const parsed = safeParseConvertIntentToOpportunity({
      intentId: VALID_INTENT_ID,
    });
    assert.equal(parsed.success, true);
  });

  it("rejects invalid intentId", () => {
    const parsed = safeParseConvertIntentToOpportunity({ intentId: "bad" });
    assert.equal(parsed.success, false);
  });
});

describe("saved intent list filter support", () => {
  it("parseIntentStatusFilter supports saved", () => {
    assert.equal(parseIntentStatusFilter("saved"), "saved");
  });
});

describe("intent conversion auth and transaction wiring", () => {
  it("convert action requires admin", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/lib/business/intents/actions.ts"
      ),
      "utf8"
    );
    assert.match(
      source,
      /export async function convertIntentToOpportunityFormAction[\s\S]*?await requireAdmin\(\)/
    );
  });

  it("convert action rethrows NEXT_REDIRECT after successful conversion", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/lib/business/intents/actions.ts"
      ),
      "utf8"
    );
    assert.match(
      source,
      /convertIntentToOpportunityFormAction[\s\S]*?redirect\(`\/admin\/business\/opportunities\/\$\{result\.opportunity\.id\}`\)[\s\S]*?NEXT_REDIRECT[\s\S]*?throw error/
    );
  });

  it("data layer uses transaction and conditional intent update", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/lib/data/intent-opportunity-conversion.ts"
      ),
      "utf8"
    );
    assert.match(source, /withTransaction/);
    assert.match(source, /INTENT_ALREADY_CONVERTED/);
    assert.match(source, /status: "saved"/);
    assert.match(source, /intentId: intentObjectId/);
    assert.match(source, /opportunityId: createdOpportunityId/);
  });

  it("Opportunity schema defines unique sparse intentId index", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/models/Opportunity.ts"
      ),
      "utf8"
    );
    assert.match(source, /intentId/);
    assert.match(source, /unique: true, sparse: true/);
  });

  it("Intent schema uses unique sparse opportunityId index", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/models/Intent.ts"
      ),
      "utf8"
    );
    assert.match(source, /opportunityId: 1/);
    assert.match(source, /unique: true, sparse: true/);
  });

  it("blocks classification updates on saved intents", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/lib/data/intents.ts"
      ),
      "utf8"
    );
    assert.match(source, /INTENT_CLASSIFICATION_LOCKED/);
    assert.match(source, /status === "saved"/);
  });

  it("countActionableIntents matches inbox semantics", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/lib/data/intents.ts"
      ),
      "utf8"
    );
    assert.match(source, /countActionableIntents/);
    assert.match(source, /status: "new"/);
    assert.match(source, /unclassified/);
    assert.match(source, /explicitNeed/);
    assert.match(source, /possibleNeed/);
  });

  it("overview includes classified review intents count", () => {
    const overviewData = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/lib/business/overview-dashboard-data.ts"
      ),
      "utf8"
    );
    const businessPage = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/components/admin/business/overview/BusinessOverviewKpiRow.tsx"
      ),
      "utf8"
    );
    assert.match(overviewData, /countClassifiedReviewIntents/);
    assert.match(overviewData, /classifiedReviewIntentsCount/);
    assert.match(businessPage, /כוונות לסקירה/);
    assert.match(businessPage, /\/admin\/business\/intent/);
  });

  it("Opportunity detail DTO includes intentId", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/lib/data/opportunities.ts"
      ),
      "utf8"
    );
    assert.match(source, /intentId: doc\.intentId/);
  });

  it("Opportunity provenance UI links back to intent", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/components/admin/business/opportunities/OpportunityDetail.tsx"
      ),
      "utf8"
    );
    assert.match(source, /נוצר מכוונה/);
    assert.match(source, /\/admin\/business\/intent\//);
  });

  it("Intent detail exposes save as opportunity action", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/components/admin/business/intents/IntentDetail.tsx"
      ),
      "utf8"
    );
    assert.match(source, /שמור כהזדמנות/);
    assert.match(source, /convertIntentToOpportunityFormAction/);
  });

  it("saved status tab exists in intent filters", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/components/admin/business/intents/IntentFilters.tsx"
      ),
      "utf8"
    );
    assert.match(source, /נשמרו/);
    assert.match(source, /saved/);
  });

  it("existing opportunity to lead conversion remains transaction-based", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/lib/data/opportunity-conversion.ts"
      ),
      "utf8"
    );
    assert.match(source, /convertOpportunityToLead/);
    assert.match(source, /withTransaction/);
    assert.match(source, /OPPORTUNITY_ALREADY_CONVERTED/);
  });
});

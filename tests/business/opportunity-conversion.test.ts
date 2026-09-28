import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  buildLeadInternalNotesFromOpportunity,
  buildLeadMessageFromOpportunity,
  deriveOpportunityConversionName,
} from "../../src/lib/business/opportunities/conversion-mapping";
import { LEAD_SOURCE_LABELS } from "../../src/lib/leads/rules";
import { LEAD_SOURCES } from "../../src/types/lead";
import {
  safeParseConvertOpportunityToLead,
} from "../../src/lib/validations/opportunity-conversion";
import { safeParseLandingPageLeadInput, safeParseWebsiteLeadInput } from "../../src/lib/validations/lead";

const VALID_OPP_ID = "507f1f77bcf86cd799439011";

describe("lead source opportunity", () => {
  it("includes opportunity in LEAD_SOURCES", () => {
    assert.ok(LEAD_SOURCES.includes("opportunity"));
    assert.ok(LEAD_SOURCES.includes("website"));
    assert.ok(LEAD_SOURCES.includes("landingPage"));
  });

  it("has Hebrew label for opportunity source", () => {
    assert.equal(LEAD_SOURCE_LABELS.opportunity, "הזדמנות");
  });
});

describe("opportunity conversion validation", () => {
  it("accepts name + phone only", () => {
    const result = safeParseConvertOpportunityToLead({
      opportunityId: VALID_OPP_ID,
      name: "ישראל ישראלי",
      phone: "050-1234567",
    });
    assert.equal(result.success, true);
  });

  it("accepts name + email only", () => {
    const result = safeParseConvertOpportunityToLead({
      opportunityId: VALID_OPP_ID,
      name: "ישראל ישראלי",
      email: "test@example.com",
    });
    assert.equal(result.success, true);
  });

  it("accepts name + phone + email", () => {
    const result = safeParseConvertOpportunityToLead({
      opportunityId: VALID_OPP_ID,
      name: "ישראל",
      phone: "050-1234567",
      email: "a@b.com",
    });
    assert.equal(result.success, true);
  });

  it("rejects name without phone or email", () => {
    const result = safeParseConvertOpportunityToLead({
      opportunityId: VALID_OPP_ID,
      name: "ישראל",
    });
    assert.equal(result.success, false);
  });

  it("rejects invalid email", () => {
    const result = safeParseConvertOpportunityToLead({
      opportunityId: VALID_OPP_ID,
      name: "ישראל",
      email: "not-email",
    });
    assert.equal(result.success, false);
  });

  it("rejects invalid phone", () => {
    const result = safeParseConvertOpportunityToLead({
      opportunityId: VALID_OPP_ID,
      name: "ישראל",
      phone: "abc",
    });
    assert.equal(result.success, false);
  });

  it("rejects invalid opportunity ObjectId", () => {
    const result = safeParseConvertOpportunityToLead({
      opportunityId: "xyz",
      name: "ישראל",
      phone: "050-1234567",
    });
    assert.equal(result.success, false);
  });
});

describe("opportunity conversion mapping", () => {
  it("prefills name contactName → businessName → title", () => {
    assert.equal(
      deriveOpportunityConversionName({
        contactName: "דני",
        businessName: "עסק",
        title: "כותרת",
      }),
      "דני"
    );
    assert.equal(
      deriveOpportunityConversionName({
        businessName: "עסק",
        title: "כותרת",
      }),
      "עסק"
    );
    assert.equal(
      deriveOpportunityConversionName({ title: "כותרת" }),
      "כותרת"
    );
  });

  it("maps description, relevance, and sourceUrl into message", () => {
    const message = buildLeadMessageFromOpportunity({
      description: "תיאור",
      relevanceNote: "רלוונטי",
      sourceUrl: "https://example.com/x",
    });
    assert.ok(message?.includes("תיאור"));
    assert.ok(message?.includes("רלוונטי"));
    assert.ok(message?.includes("https://example.com/x"));
  });

  it("preserves internal notes and provenance path", () => {
    const notes = buildLeadInternalNotesFromOpportunity(
      { internalNotes: "הערה פנימית" },
      VALID_OPP_ID
    );
    assert.ok(notes.includes("הערה פנימית"));
    assert.ok(notes.includes(`/admin/business/opportunities/${VALID_OPP_ID}`));
  });
});

describe("public lead validation unchanged", () => {
  it("website lead still requires phone and email", () => {
    const missingEmail = safeParseWebsiteLeadInput({
      name: "Test",
      phone: "050-1234567",
      email: "",
    });
    assert.equal(missingEmail.success, false);

    const valid = safeParseWebsiteLeadInput({
      name: "Test",
      phone: "050-1234567",
      email: "a@b.com",
    });
    assert.equal(valid.success, true);
  });

  it("landing page lead still requires phone and email", () => {
    const missingPhone = safeParseLandingPageLeadInput({
      name: "Test",
      phone: "",
      email: "a@b.com",
    });
    assert.equal(missingPhone.success, false);
  });
});

describe("convertOpportunityToLeadAction security", () => {
  it("calls requireAdmin", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/lib/business/opportunities/actions.ts"
      ),
      "utf8"
    );
    assert.match(
      source,
      /export async function convertOpportunityToLeadAction[\s\S]*?await requireAdmin\(\)/
    );
  });
});

describe("conversion duplicate protection in data layer", () => {
  it("throws OPPORTUNITY_ALREADY_CONVERTED when marking converted", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/lib/data/opportunity-conversion.ts"
      ),
      "utf8"
    );
    assert.match(source, /OPPORTUNITY_ALREADY_CONVERTED/);
    assert.match(source, /withTransaction/);
    assert.match(source, /leadId/);
    assert.match(source, /FollowUp\.updateMany/);
  });
});

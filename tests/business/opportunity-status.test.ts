import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertOpportunityStatusTransition,
  canTransitionOpportunityStatus,
  getManualStatusTransitionTargets,
  OPPORTUNITY_CLASSIFICATION_LABELS,
  OPPORTUNITY_SOURCE_LABELS,
  OPPORTUNITY_STATUS_LABELS,
  isManualOpportunityStatus,
  isOpportunityClassification,
  isOpportunitySource,
  isOpportunityStatus,
  normalizeOpportunityListPagination,
} from "../../src/lib/business/opportunities/rules";
import { OPPORTUNITY_STATUSES } from "../../src/types/opportunity";

describe("opportunity labels and guards", () => {
  it("exposes Hebrew status labels", () => {
    assert.equal(OPPORTUNITY_STATUS_LABELS.new, "חדש");
    assert.equal(OPPORTUNITY_STATUS_LABELS.converted, "הומר לליד");
  });

  it("exposes Hebrew classification labels", () => {
    assert.equal(OPPORTUNITY_CLASSIFICATION_LABELS.explicitNeed, "צורך מפורש");
    assert.equal(OPPORTUNITY_CLASSIFICATION_LABELS.businessDiscovery, "עסק פוטנציאלי");
  });

  it("exposes source labels", () => {
    assert.equal(OPPORTUNITY_SOURCE_LABELS.manual, "ידני");
    assert.ok(OPPORTUNITY_SOURCE_LABELS.intent);
  });

  it("recognizes valid enum values", () => {
    assert.equal(isOpportunityStatus("new"), true);
    assert.equal(isOpportunityStatus("invalid"), false);
    assert.equal(isOpportunitySource("referral"), true);
    assert.equal(isOpportunityClassification("possibleNeed"), true);
  });

  it("manual status excludes converted", () => {
    assert.equal(isManualOpportunityStatus("dismissed"), true);
    assert.equal(isManualOpportunityStatus("converted"), false);
    for (const status of OPPORTUNITY_STATUSES) {
      if (status === "converted") {
        assert.equal(isManualOpportunityStatus(status), false);
      }
    }
  });
});

describe("opportunity status transitions", () => {
  it("allows movement between active statuses", () => {
    assert.equal(canTransitionOpportunityStatus("new", "researching"), true);
    assert.equal(canTransitionOpportunityStatus("researching", "contacted"), true);
    assert.equal(canTransitionOpportunityStatus("contacted", "new"), true);
  });

  it("allows dismiss from active statuses", () => {
    assert.equal(canTransitionOpportunityStatus("new", "dismissed"), true);
    assert.equal(canTransitionOpportunityStatus("contacted", "dismissed"), true);
  });

  it("allows reopen from dismissed to active statuses", () => {
    assert.equal(canTransitionOpportunityStatus("dismissed", "new"), true);
    assert.equal(canTransitionOpportunityStatus("dismissed", "researching"), true);
    assert.equal(canTransitionOpportunityStatus("dismissed", "contacted"), true);
  });

  it("rejects manual transition to converted", () => {
    assert.equal(canTransitionOpportunityStatus("new", "converted"), false);
    assert.equal(canTransitionOpportunityStatus("contacted", "converted"), false);
  });

  it("rejects any transition away from converted", () => {
    for (const status of OPPORTUNITY_STATUSES) {
      if (status === "converted") continue;
      assert.equal(canTransitionOpportunityStatus("converted", status), false);
    }
  });

  it("getManualStatusTransitionTargets excludes converted and current", () => {
    const fromNew = getManualStatusTransitionTargets("new");
    assert.ok(fromNew.includes("researching"));
    assert.ok(!fromNew.includes("new"));
    assert.ok(!fromNew.includes("converted" as never));

    assert.deepEqual(getManualStatusTransitionTargets("converted"), []);
  });

  it("assertOpportunityStatusTransition throws on invalid moves", () => {
    assert.throws(
      () => assertOpportunityStatusTransition("converted", "new"),
      /INVALID_OPPORTUNITY_STATUS_TRANSITION/
    );
    assert.throws(
      () => assertOpportunityStatusTransition("new", "converted"),
      /INVALID_OPPORTUNITY_STATUS_TRANSITION/
    );
  });
});

describe("opportunity list pagination normalization", () => {
  it("defaults page size to 20", () => {
    const result = normalizeOpportunityListPagination({});
    assert.deepEqual(result, { page: 1, pageSize: 20 });
  });

  it("caps page size at 100", () => {
    const result = normalizeOpportunityListPagination({ pageSize: 500 });
    assert.equal(result.pageSize, 100);
  });

  it("floors invalid page to 1", () => {
    const result = normalizeOpportunityListPagination({ page: 0, pageSize: 10 });
    assert.equal(result.page, 1);
    assert.equal(result.pageSize, 10);
  });
});

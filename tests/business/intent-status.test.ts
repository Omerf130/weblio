import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canTransitionIntentStatus,
  getManualIntentStatusTransitionTargets,
  INTENT_STATUS_LABELS,
  normalizeIntentListPagination,
} from "../../src/lib/business/intents/rules";

describe("intent status labels", () => {
  it("exposes Hebrew status labels", () => {
    assert.equal(INTENT_STATUS_LABELS.new, "חדש");
    assert.equal(INTENT_STATUS_LABELS.dismissed, "נדחה");
    assert.equal(INTENT_STATUS_LABELS.saved, "נשמר כהזדמנות");
  });
});

describe("intent status transitions", () => {
  it("allows new → dismissed", () => {
    assert.equal(canTransitionIntentStatus("new", "dismissed"), true);
  });

  it("allows dismissed → new", () => {
    assert.equal(canTransitionIntentStatus("dismissed", "new"), true);
  });

  it("does not allow manual new → saved", () => {
    assert.equal(canTransitionIntentStatus("new", "saved"), false);
  });

  it("does not allow dismissed → saved", () => {
    assert.equal(canTransitionIntentStatus("dismissed", "saved"), false);
  });

  it("saved is terminal", () => {
    assert.equal(canTransitionIntentStatus("saved", "new"), false);
    assert.equal(canTransitionIntentStatus("saved", "dismissed"), false);
  });

  it("manual status targets never include saved", () => {
    assert.deepEqual(getManualIntentStatusTransitionTargets("new"), ["dismissed"]);
    assert.deepEqual(getManualIntentStatusTransitionTargets("dismissed"), ["new"]);
    assert.deepEqual(getManualIntentStatusTransitionTargets("saved"), []);
  });
});

describe("intent list pagination", () => {
  it("defaults page size to 20", () => {
    assert.deepEqual(normalizeIntentListPagination({}), { page: 1, pageSize: 20 });
  });

  it("caps page size at 100", () => {
    assert.deepEqual(normalizeIntentListPagination({ pageSize: 500 }), {
      page: 1,
      pageSize: 100,
    });
  });
});

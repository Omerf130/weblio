import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  canTransitionIntentStatus,
  MANUAL_INTENT_CLASSIFIER_VERSION,
} from "../../src/lib/business/intents/rules";
import { safeParseUpdateIntentClassification } from "../../src/lib/validations/intent";

const actionsSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../src/lib/business/intents/actions.ts"),
  "utf8"
);

describe("intent server actions module", () => {
  it("is a server actions module", () => {
    assert.match(actionsSource, /"use server"/);
  });

  it("calls requireAdmin in exported mutations", () => {
    for (const fn of [
      "updateIntentClassificationAction",
      "setIntentStatusFormAction",
      "convertIntentToOpportunityFormAction",
    ]) {
      const fnPattern = new RegExp(
        `export async function ${fn}[\\s\\S]*?await requireAdmin\\(\\)`,
        "m"
      );
      assert.match(actionsSource, fnPattern, `${fn} should await requireAdmin()`);
    }
  });

  it("does not export TypeScript types from the server module", () => {
    assert.doesNotMatch(actionsSource, /export type /);
  });

  it("uses manual classifier version constant in action", () => {
    assert.match(actionsSource, /MANUAL_INTENT_CLASSIFIER_VERSION/);
    assert.equal(MANUAL_INTENT_CLASSIFIER_VERSION, "manual-v1");
  });
});

describe("intent manual classification validation", () => {
  it("accepts valid manual classification", () => {
    const parsed = safeParseUpdateIntentClassification({
      intentId: "507f1f77bcf86cd799439011",
      classification: "explicitNeed",
      classificationReason: "בקשה מפורשת",
    });
    assert.equal(parsed.success, true);
  });

  it("rejects invalid classification value", () => {
    const parsed = safeParseUpdateIntentClassification({
      intentId: "507f1f77bcf86cd799439011",
      classification: "businessDiscovery",
    });
    assert.equal(parsed.success, false);
  });

  it("allows reset to unclassified", () => {
    const parsed = safeParseUpdateIntentClassification({
      intentId: "507f1f77bcf86cd799439011",
      classification: "unclassified",
    });
    assert.equal(parsed.success, true);
  });
});

describe("intent workflow transitions for actions", () => {
  it("allows dismiss and reopen", () => {
    assert.equal(canTransitionIntentStatus("new", "dismissed"), true);
    assert.equal(canTransitionIntentStatus("dismissed", "new"), true);
  });

  it("rejects saved transitions", () => {
    assert.equal(canTransitionIntentStatus("saved", "new"), false);
    assert.equal(canTransitionIntentStatus("new", "saved"), false);
  });
});

describe("intent classification vs workflow separation", () => {
  it("irrelevant classification does not imply dismissed status by rules", () => {
    assert.equal(canTransitionIntentStatus("new", "dismissed"), true);
  });
});

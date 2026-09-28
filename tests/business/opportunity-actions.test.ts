import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const actionsSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../src/lib/business/opportunities/actions.ts"),
  "utf8"
);

describe("opportunity server actions module", () => {
  it("is a server actions module", () => {
    assert.match(actionsSource, /"use server"/);
  });

  it("calls requireAdmin in each exported mutation", () => {
    const exportsRequiringAdmin = [
      "createOpportunityAction",
      "updateOpportunityAction",
      "updateOpportunityStatusAction",
      "deleteOpportunityAction",
      "setOpportunityStatusFormAction",
      "convertOpportunityToLeadAction",
    ];

    for (const fn of exportsRequiringAdmin) {
      const fnPattern = new RegExp(
        `export async function ${fn}[\\s\\S]*?await requireAdmin\\(\\)`,
        "m"
      );
      assert.match(
        actionsSource,
        fnPattern,
        `${fn} should await requireAdmin()`
      );
    }
  });

  it("does not export TypeScript types from the server module", () => {
    assert.doesNotMatch(actionsSource, /export type /);
  });
});

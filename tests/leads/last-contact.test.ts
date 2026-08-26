import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldSetLastContactAt } from "../../src/lib/leads/rules";

describe("last contact date behavior", () => {
  it("updates lastContactAt only when status changes to contacted", () => {
    assert.equal(shouldSetLastContactAt("new"), false);
    assert.equal(shouldSetLastContactAt("inProgress"), false);
    assert.equal(shouldSetLastContactAt("closed"), false);
    assert.equal(shouldSetLastContactAt("archived"), false);
    assert.equal(shouldSetLastContactAt("contacted", "new"), true);
    assert.equal(shouldSetLastContactAt("contacted", "inProgress"), true);
    assert.equal(shouldSetLastContactAt("contacted", "contacted"), false);
  });
});

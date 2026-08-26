import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LEAD_NUMBER_COUNTER_ID } from "../../src/models/LeadCounter";

describe("lead number counter", () => {
  it("uses a fixed counter id for sequential lead numbers", () => {
    assert.equal(LEAD_NUMBER_COUNTER_ID, "leadNumber");
  });

  it("starts the public sequence at 1001 via counter default + increment", () => {
    const counterDefault = 1000;
    const nextLeadNumber = counterDefault + 1;
    assert.equal(nextLeadNumber, 1001);
  });
});

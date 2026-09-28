import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildOpportunityListQuery } from "../../src/lib/data/opportunities";

describe("opportunity list query builder", () => {
  it("builds empty query with no filters", () => {
    assert.deepEqual(buildOpportunityListQuery({}), {});
  });

  it("applies structured filters", () => {
    const query = buildOpportunityListQuery({
      status: "new",
      classification: "explicitNeed",
      source: "manual",
    });
    assert.deepEqual(query, {
      status: "new",
      classification: "explicitNeed",
      source: "manual",
    });
  });

  it("adds case-insensitive search on identity fields", () => {
    const query = buildOpportunityListQuery({ q: "weblio" });
    assert.ok(Array.isArray(query.$or));
    assert.equal((query.$or as unknown[]).length, 3);
  });

  it("escapes regex special characters in search", () => {
    const query = buildOpportunityListQuery({ q: "a+b" });
    const or = query.$or as { title: RegExp }[];
    assert.match(String(or[0].title), /\\\+/);
  });
});

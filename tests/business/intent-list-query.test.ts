import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildIntentListQuery } from "../../src/lib/data/intents";

describe("intent list query builder", () => {
  it("builds empty query with no filters", () => {
    assert.deepEqual(buildIntentListQuery({}), {});
  });

  it("applies structured filters", () => {
    const query = buildIntentListQuery({
      status: "new",
      classification: "explicitNeed",
      provider: "DEV",
    });
    assert.deepEqual(query, {
      status: "new",
      classification: "explicitNeed",
      provider: "dev",
    });
  });

  it("applies classifications inbox filter as $in query", () => {
    const query = buildIntentListQuery({
      classifications: ["unclassified", "explicitNeed", "possibleNeed"],
    });
    assert.deepEqual(query.classification, {
      $in: ["unclassified", "explicitNeed", "possibleNeed"],
    });
  });

  it("adds case-insensitive search on title and content", () => {
    const query = buildIntentListQuery({ q: "weblio" });
    assert.ok(Array.isArray(query.$or));
    assert.equal((query.$or as unknown[]).length, 2);
  });

  it("escapes regex special characters in search", () => {
    const query = buildIntentListQuery({ q: "a+b" });
    const or = query.$or as { title: RegExp }[];
    assert.equal(or[0].title.source, "a\\+b");
  });
});

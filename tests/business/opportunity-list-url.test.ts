import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildOpportunityListHref } from "../../src/lib/business/opportunities/list-url";

describe("buildOpportunityListHref", () => {
  it("builds base path without filters", () => {
    assert.equal(buildOpportunityListHref({}), "/admin/business/opportunities");
  });

  it("preserves filters and resets page via caller", () => {
    const href = buildOpportunityListHref({
      status: "new",
      classification: "explicitNeed",
      source: "manual",
      q: "חיפה",
      page: 2,
    });
    assert.match(href, /status=new/);
    assert.match(href, /classification=explicitNeed/);
    assert.match(href, /source=manual/);
    assert.match(href, /q=/);
    assert.match(href, /page=2/);
  });
});

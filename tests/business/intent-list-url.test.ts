import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildIntentListHref,
  mapIntentFiltersToListOptions,
  parseIntentClassificationFilter,
  parseIntentListPage,
  parseIntentProviderFilter,
  parseIntentStatusFilter,
  resolveIntentMonitorFilters,
} from "../../src/lib/business/intents/list-url";

describe("intent list URL helpers", () => {
  it("parses status filter", () => {
    assert.equal(parseIntentStatusFilter("dismissed"), "dismissed");
    assert.equal(parseIntentStatusFilter("invalid"), "all");
  });

  it("parses classification filter", () => {
    assert.equal(parseIntentClassificationFilter("explicitNeed"), "explicitNeed");
    assert.equal(parseIntentClassificationFilter("inbox"), "inbox");
    assert.equal(parseIntentClassificationFilter("bad"), "all");
  });

  it("defaults monitor filters to new + inbox", () => {
    assert.deepEqual(resolveIntentMonitorFilters({}), {
      status: "new",
      classification: "inbox",
    });
  });

  it("maps inbox filter to explicit classification list for data layer", () => {
    const options = mapIntentFiltersToListOptions({
      status: "new",
      classification: "inbox",
    });
    assert.deepEqual(options.classifications, [
      "unclassified",
      "explicitNeed",
      "possibleNeed",
    ]);
    assert.equal(options.classification, undefined);
  });

  it("builds href with inbox classification", () => {
    const href = buildIntentListHref({
      status: "new",
      classification: "inbox",
    });
    assert.match(href, /classification=inbox/);
  });

  it("parses provider filter", () => {
    assert.equal(parseIntentProviderFilter("Brave"), "brave");
    assert.equal(parseIntentProviderFilter(undefined), "all");
  });

  it("parses page number", () => {
    assert.equal(parseIntentListPage("3"), 3);
    assert.equal(parseIntentListPage("-1"), 1);
  });

  it("builds href with filters", () => {
    const href = buildIntentListHref({
      status: "new",
      classification: "possibleNeed",
      provider: "dev",
      q: "אתר",
      page: 2,
    });
    assert.match(href, /^\/admin\/business\/intent\?/);
    assert.match(href, /status=new/);
    assert.match(href, /classification=possibleNeed/);
    assert.match(href, /provider=dev/);
    assert.match(href, /page=2/);
  });
});

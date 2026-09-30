import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  getProductionDiscoveryPolicy,
} from "../../src/lib/discovery/discovery-policy";
import {
  loadSearchProfileCatalog,
  loadSearchProfileCatalogPoc1,
  loadSearchProfileCatalogPoc2,
  loadSearchProfileCatalogProduction,
  POC1_CATALOG_PATH,
  POC2_CATALOG_PATH,
  PRODUCTION_CATALOG_PATH,
  parseSearchProfileCatalog,
} from "../../src/lib/discovery/providers/load-search-profiles";

describe("search profile catalog", () => {
  it("loads 12 Hebrew profiles from config", () => {
    const catalog = loadSearchProfileCatalog();
    assert.equal(catalog.version, 1);
    assert.equal(catalog.profiles.length, 12);
    assert.equal(catalog.profiles[0]?.id, "A1");
    assert.equal(catalog.profiles[11]?.id, "E3");
  });

  it("rejects duplicate ids in catalog validation", () => {
    const catalog = loadSearchProfileCatalog();
    const ids = catalog.profiles.map((profile) => profile.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("config file contains no secret-like placeholders", () => {
    const path = join(
      dirname(fileURLToPath(import.meta.url)),
      "../../config/discovery/search-profiles.he.json"
    );
    const raw = readFileSync(path, "utf8");
    assert.doesNotMatch(raw, /tvly-/i);
    assert.doesNotMatch(raw, /TAVILY_API_KEY/i);
  });

  it("parseSearchProfileCatalog validates shape", () => {
    assert.throws(() => parseSearchProfileCatalog({ version: 0, profiles: [] }));
  });

  it("loads PoC #2 explicit-intent catalog with 12 profiles", () => {
    const catalog = loadSearchProfileCatalogPoc2();
    assert.equal(catalog.pocVersion, 2);
    assert.equal(catalog.strategy, "explicit-intent-focused");
    assert.equal(catalog.profiles.length, 12);
    const ids = catalog.profiles.map((p) => p.id);
    assert.deepEqual(ids, [
      "A1",
      "A2",
      "A3",
      "A4",
      "A5",
      "A6",
      "B1",
      "B2",
      "C1",
      "C2",
      "D1",
      "D2",
    ]);
    assert.ok(!ids.some((id) => id.startsWith("E")));
  });

  it("loads production catalog with exactly 7 explicit-intent profiles", () => {
    const catalog = loadSearchProfileCatalogProduction();
    assert.equal(catalog.environment, "production");
    assert.equal(catalog.strategy, "explicit-intent");
    assert.equal(catalog.version, 2);
    assert.equal(catalog.profiles.length, 7);
    assert.deepEqual(
      catalog.profiles.map((p) => ({ id: p.id, queryHe: p.queryHe })),
      [
        { id: "W1", queryHe: "מחפש מישהו שיבנה לי אתר לעסק" },
        { id: "W2", queryHe: "מחפש מישהו שיבנה לי חנות Shopify" },
        { id: "W3", queryHe: "מחפש המלצה על בונה אתרים לעסק" },
        { id: "W4", queryHe: "מחפש הצעת מחיר לבניית אתר לעסק" },
        { id: "W5", queryHe: "מחפש מישהו שיבנה לי דף נחיתה לעסק" },
        { id: "W6", queryHe: "האתר שלנו מיושן מחפשים מישהו שיעצב אותו מחדש" },
        { id: "W7", queryHe: "צריך מישהו שיבנה לי חנות אינטרנטית לעסק" },
      ]
    );
  });

  it("production catalog has unique demand-side queries without retired noise strings", () => {
    const catalog = loadSearchProfileCatalogProduction();
    const queries = catalog.profiles.map((profile) => profile.queryHe);
    assert.equal(new Set(queries).size, queries.length);
    for (const query of queries) {
      assert.doesNotMatch(query, /site:/i);
    }
    const joined = queries.join("\n");
    assert.doesNotMatch(joined, /מחפש בונה אתרים$/m);
    assert.doesNotMatch(joined, /מישהו מכיר בונה אתרים מומלץ/);
    assert.doesNotMatch(joined, /מחפש מישהו שישדרג לי אתר קיים/);
    assert.doesNotMatch(joined, /מחפש מישהו שיעצב מחדש את האתר של העסק/);
  });

  it("production discovery budget remains 7 profiles × 5 results with week time_range", () => {
    const policy = getProductionDiscoveryPolicy();
    const catalog = loadSearchProfileCatalogProduction();
    assert.equal(policy.limits.maxProfilesPerRun, 7);
    assert.equal(policy.limits.maxTavilyRequestsPerRun, 7);
    assert.equal(policy.tavily.maxResultsPerQuery, 5);
    assert.equal(policy.limits.maxCandidatesPerRun, 35);
    assert.equal(policy.limits.maxClassificationsPerRun, 20);
    assert.equal(policy.tavily.timeRange, "week");
    assert.equal(policy.tavily.searchDepth, "basic");
    assert.equal(catalog.profiles.length, 7);
  });

  it("production catalog path is separate from PoC catalogs", () => {
    assert.notEqual(PRODUCTION_CATALOG_PATH, POC1_CATALOG_PATH);
    assert.notEqual(PRODUCTION_CATALOG_PATH, POC2_CATALOG_PATH);
    const poc1 = loadSearchProfileCatalogPoc1();
    const prod = loadSearchProfileCatalogProduction();
    assert.equal(poc1.profiles.length, 12);
    assert.equal(prod.profiles.length, 7);
    assert.equal(prod.profiles[0]?.id, "W1");
    assert.equal(poc1.profiles[0]?.id, "A1");
  });

  it("production config contains no secret-like placeholders", () => {
    const path = join(
      dirname(fileURLToPath(import.meta.url)),
      "../../config/discovery/search-profiles.he.prod.json"
    );
    const raw = readFileSync(path, "utf8");
    assert.doesNotMatch(raw, /tvly-/i);
    assert.doesNotMatch(raw, /TAVILY_API_KEY/i);
  });

  it("PoC #2 config contains no secret-like placeholders", () => {
    const path = join(
      dirname(fileURLToPath(import.meta.url)),
      "../../config/discovery/search-profiles.he.poc2.json"
    );
    const raw = readFileSync(path, "utf8");
    assert.doesNotMatch(raw, /tvly-/i);
    assert.doesNotMatch(raw, /TAVILY_API_KEY/i);
  });
});

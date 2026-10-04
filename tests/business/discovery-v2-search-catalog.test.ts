import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  loadSearchProfileCatalogV2Production,
  PRODUCTION_V2_CATALOG_PATH,
} from "../../src/lib/discovery/providers/load-search-profiles";
import {
  validateHebrewQueryLatinMix,
  V2_CORE_PROFILE_COUNT,
  V2_EXPERIMENTAL_PROFILE_COUNT,
  V2_PRODUCTION_CATALOG_PROFILE_COUNT,
  V2_ROTATING_PROFILE_COUNT,
} from "../../src/lib/discovery/providers/validate-v2-search-catalog";

describe("search catalog V2 production", () => {
  it("loads V2.2 profiles with approved tier counts", () => {
    const catalog = loadSearchProfileCatalogV2Production();
    assert.equal(catalog.catalogKind, "v2");
    assert.equal(catalog.environment, "production-v2.2");
    assert.equal(catalog.version, 4);
    assert.equal(catalog.profiles.length, V2_PRODUCTION_CATALOG_PROFILE_COUNT);

    const core = catalog.profiles.filter((p) => p.tier === "core");
    const rotating = catalog.profiles.filter((p) => p.tier === "rotating");
    const experimental = catalog.profiles.filter((p) => p.tier === "experimental");
    assert.equal(core.length, V2_CORE_PROFILE_COUNT);
    assert.equal(rotating.length, V2_ROTATING_PROFILE_COUNT);
    assert.equal(experimental.length, V2_EXPERIMENTAL_PROFILE_COUNT);
  });

  it("has unique ids and queries; K14/K15 rotating; nine core profiles", () => {
    const catalog = loadSearchProfileCatalogV2Production();
    const ids = catalog.profiles.map((p) => p.id);
    const queries = catalog.profiles.map((p) => p.queryHe);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(new Set(queries).size, queries.length);

    const k14 = catalog.profiles.find((p) => p.id === "K14");
    const k15 = catalog.profiles.find((p) => p.id === "K15");
    assert.equal(k14?.tier, "rotating");
    assert.equal(k15?.tier, "rotating");
    assert.equal(catalog.profiles.filter((p) => p.tier === "core").length, V2_CORE_PROFILE_COUNT);
  });

  it("typo guard rejects mixed Latin/Hebrew but allows product names", () => {
    assert.equal(validateHebrewQueryLatinMix("מישהu שיבנה"), "QUERY_LATIN_HEBREW_MIX");
    assert.equal(validateHebrewQueryLatinMix("מחפש Shopify לעסק"), null);
    assert.equal(validateHebrewQueryLatinMix("שידרוג WordPress ו-SEO"), null);
    assert.equal(validateHebrewQueryLatinMix("WooCommerce ו-Wix"), null);
  });

  it("V2 catalog path is separate from legacy production catalog", () => {
    assert.match(PRODUCTION_V2_CATALOG_PATH, /search-profiles\.he\.v2\.prod\.json$/);
  });
});

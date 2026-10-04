import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_V2_DAILY_SELECTION_TARGETS,
  selectDailyDiscoveryProfiles,
} from "../../src/lib/discovery/discovery-daily-profile-selector";
import {
  getV2ProductionDiscoveryPolicy,
  V2_2_PRODUCTION_DISCOVERY_POLICY,
} from "../../src/lib/discovery/discovery-policy";
import { loadSearchProfileCatalogV2Production } from "../../src/lib/discovery/providers/load-search-profiles";
import {
  V2_2_DISABLED_PROFILE_IDS,
  V2_CORE_PROFILE_COUNT,
  V2_EXPERIMENTAL_PROFILE_COUNT,
  V2_PRODUCTION_CATALOG_PROFILE_COUNT,
  V2_ROTATING_PROFILE_COUNT,
} from "../../src/lib/discovery/providers/validate-v2-search-catalog";

const V2_2_CORE_IDS = [
  "K01",
  "K03",
  "K04",
  "K05",
  "K07",
  "K08",
  "K13",
  "R05",
  "R06",
] as const;

describe("V2.2 catalog tuning", () => {
  const catalog = loadSearchProfileCatalogV2Production();
  const israelNoon = new Date("2026-10-01T09:00:00.000Z");
  const nextIsraelDay = new Date("2026-10-02T09:00:00.000Z");

  it("loads V2.2 catalog with expected tier counts", () => {
    assert.equal(catalog.version, 4);
    assert.equal(catalog.environment, "production-v2.2");
    assert.equal(catalog.profiles.length, V2_PRODUCTION_CATALOG_PROFILE_COUNT);
    assert.equal(catalog.profiles.filter((p) => p.tier === "core").length, V2_CORE_PROFILE_COUNT);
    assert.equal(
      catalog.profiles.filter((p) => p.tier === "rotating").length,
      V2_ROTATING_PROFILE_COUNT
    );
    assert.equal(
      catalog.profiles.filter((p) => p.tier === "experimental").length,
      V2_EXPERIMENTAL_PROFILE_COUNT
    );
  });

  it("has unique ids and unique queries", () => {
    const ids = catalog.profiles.map((p) => p.id);
    const queries = catalog.profiles.map((p) => p.queryHe.trim());
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(new Set(queries).size, queries.length);
  });

  it("disables X06, X08, X09 and demotes K06, K09, K12 from core", () => {
    for (const id of V2_2_DISABLED_PROFILE_IDS) {
      const profile = catalog.profiles.find((p) => p.id === id);
      assert.equal(profile?.enabled, false, id);
    }
    for (const id of ["K06", "K09", "K12"] as const) {
      const profile = catalog.profiles.find((p) => p.id === id);
      assert.equal(profile?.tier, "rotating", id);
    }
  });

  it("promotes R05 and R06 to core with nine core ids", () => {
    const coreIds = catalog.profiles.filter((p) => p.tier === "core").map((p) => p.id);
    assert.deepEqual([...coreIds].sort(), [...V2_2_CORE_IDS].sort());
    assert.equal(catalog.profiles.find((p) => p.id === "R05")?.tier, "core");
    assert.equal(catalog.profiles.find((p) => p.id === "R06")?.tier, "core");
  });

  it("includes social experimental variants X10–X12", () => {
    const x10 = catalog.profiles.find((p) => p.id === "X10");
    const x11 = catalog.profiles.find((p) => p.id === "X11");
    const x12 = catalog.profiles.find((p) => p.id === "X12");
    assert.equal(x10?.tier, "experimental");
    assert.match(x10?.queryHe ?? "", /site:facebook\.com/);
    assert.match(x11?.queryHe ?? "", /site:facebook\.com/);
    assert.match(x12?.queryHe ?? "", /site:instagram\.com/);
  });

  it("selects 9+4+2 profiles with V2.2 daily targets (max 15 Tavily)", () => {
    assert.deepEqual(DEFAULT_V2_DAILY_SELECTION_TARGETS, {
      core: 9,
      rotating: 4,
      experimental: 2,
    });
    const result = selectDailyDiscoveryProfiles(catalog, israelNoon);
    assert.equal(result.selected.length, 15);
    assert.equal(result.selectedProfileIds.length, 15);
    assert.equal(new Set(result.selectedProfileIds).size, 15);
    const queries = result.selected.map((p) => p.queryHe.trim());
    assert.equal(new Set(queries).size, queries.length);
    for (const id of V2_2_DISABLED_PROFILE_IDS) {
      assert.ok(!result.selectedProfileIds.includes(id));
    }
  });

  it("is deterministic for the same Israel date and rotation changes across dates", () => {
    const a = selectDailyDiscoveryProfiles(catalog, israelNoon);
    const b = selectDailyDiscoveryProfiles(catalog, new Date("2026-10-01T20:00:00.000Z"));
    assert.deepEqual(a.selectedProfileIds, b.selectedProfileIds);

    const day2 = selectDailyDiscoveryProfiles(catalog, nextIsraelDay);
    const rot1 = a.selected.filter((p) => p.tier === "rotating").map((p) => p.id);
    const rot2 = day2.selected.filter((p) => p.tier === "rotating").map((p) => p.id);
    assert.notDeepEqual(rot1, rot2);
  });

  it("exposes V2.2 production policy caps without raising downstream limits", () => {
    const policy = getV2ProductionDiscoveryPolicy();
    assert.equal(policy, V2_2_PRODUCTION_DISCOVERY_POLICY);
    assert.equal(policy.version, 3);
    assert.equal(policy.limits.maxProfilesPerRun, 15);
    assert.equal(policy.limits.maxTavilyRequestsPerRun, 15);
    assert.equal(policy.limits.maxCandidatesPerRun, 85);
    assert.equal(policy.limits.maxClassificationsPerRun, 45);
  });
});

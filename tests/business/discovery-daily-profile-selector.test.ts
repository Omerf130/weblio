import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_V2_DAILY_SELECTION_TARGETS,
  selectDailyDiscoveryProfiles,
} from "../../src/lib/discovery/discovery-daily-profile-selector";
import { loadSearchProfileCatalogV2Production } from "../../src/lib/discovery/providers/load-search-profiles";
import type { DiscoverySearchProfileCatalogV2 } from "../../src/lib/discovery/discovery-v2-types";

describe("daily profile selector (V2)", () => {
  const catalog = loadSearchProfileCatalogV2Production();
  const israelNoon = new Date("2026-10-01T09:00:00.000Z");

  it("selects 9 core + 4 rotating + 2 experimental = 15", () => {
    const result = selectDailyDiscoveryProfiles(catalog, israelNoon);
    assert.deepEqual(result.targets, DEFAULT_V2_DAILY_SELECTION_TARGETS);
    assert.equal(result.selected.length, 15);
    assert.equal(result.shortfall.total, 0);
    assert.equal(result.selectedProfileIds.length, 15);
  });

  it("is deterministic for the same Israel calendar day", () => {
    const a = selectDailyDiscoveryProfiles(catalog, israelNoon);
    const b = selectDailyDiscoveryProfiles(catalog, new Date("2026-10-01T20:00:00.000Z"));
    assert.deepEqual(a.selectedProfileIds, b.selectedProfileIds);
  });

  it("rotating window changes on a later Israel day", () => {
    const day1 = selectDailyDiscoveryProfiles(catalog, israelNoon);
    const day2 = selectDailyDiscoveryProfiles(catalog, new Date("2026-10-02T09:00:00.000Z"));
    const rotating1 = day1.selected.filter((p) => p.tier === "rotating").map((p) => p.id);
    const rotating2 = day2.selected.filter((p) => p.tier === "rotating").map((p) => p.id);
    assert.notDeepEqual(rotating1, rotating2);
  });

  it("skips disabled profiles and reports shortfall without duplicating queries", () => {
    const disabled: DiscoverySearchProfileCatalogV2 = {
      ...catalog,
      profiles: catalog.profiles.map((p) =>
        p.id === "K01" ? { ...p, enabled: false } : p
      ),
    };
    const result = selectDailyDiscoveryProfiles(disabled, israelNoon);
    assert.equal(result.selected.length, 14);
    assert.equal(result.shortfall.core, 1);
    assert.equal(result.shortfall.total, 1);
    assert.ok(!result.selectedProfileIds.includes("K01"));
    const queries = result.selected.map((p) => p.queryHe);
    assert.equal(new Set(queries).size, queries.length);
  });
});

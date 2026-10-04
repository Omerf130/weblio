import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCatalogSnapshot,
  toDiscoveryRunSummaryDto,
} from "../../src/lib/data/discovery-runs";
import { loadSearchProfileCatalogV2Production } from "../../src/lib/discovery/providers/load-search-profiles";
import { createEmptyTavilyDiscoveryRunSummary } from "../../src/lib/discovery/tavily-discovery-run-summary";

describe("DiscoveryRun V2 reproducibility fields", () => {
  it("catalog snapshot records v2 kind", () => {
    const catalog = loadSearchProfileCatalogV2Production();
    const snap = buildCatalogSnapshot(catalog);
    assert.equal(snap.catalogKind, "v2");
    assert.equal(snap.catalogVersion, 4);
    assert.equal(snap.profileCount, 49);
  });

  it("summary DTO includes selected profile counts", () => {
    const summary = createEmptyTavilyDiscoveryRunSummary(45, 46);
    summary.profilesSelected = 29;
    summary.selectionShortfallTotal = 0;
    summary.selectedProfileIds = ["K01", "K02"];

    const dto = toDiscoveryRunSummaryDto(summary);
    assert.equal(dto.profilesSelected, 29);
    assert.equal(dto.selectionShortfallTotal, 0);
  });
});

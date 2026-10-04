import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dedupeRunCandidates } from "../../src/lib/discovery/dedupe-run-candidates";
import {
  orderCandidatesForClassificationPass,
  selectCandidatesWithFairCap,
  type ProfileIntentMeta,
} from "../../src/lib/discovery/fair-candidate-selection";
import type { PreIngestCandidate } from "../../src/lib/discovery/pre-ingest-filter";
import type { NormalizedDiscoveryInput } from "../../src/lib/discovery/types";

function candidate(
  profileId: string,
  url: string,
  score: number
): PreIngestCandidate {
  const normalized: NormalizedDiscoveryInput = {
    provider: "tavily",
    sourceUrl: url,
    content: "test",
    rawMetadata: { score, profileId },
  };
  return { normalized, profileId };
}

describe("fair candidate selection", () => {
  it("round-robin prevents early profiles from monopolizing the global cap", () => {
    const profileIds = Array.from({ length: 22 }, (_, i) => `P${i + 1}`);
    const meta = new Map<string, ProfileIntentMeta>(
      profileIds.map((id, i) => [
        id,
        { intentStrength: i === 0 ? "high" : i < 5 ? "medium" : "exploratory" },
      ])
    );

    const all: PreIngestCandidate[] = [];
    for (const profileId of profileIds) {
      for (let i = 0; i < 8; i += 1) {
        all.push(
          candidate(profileId, `https://example.com/${profileId}/${i}`, 1 - i * 0.01)
        );
      }
    }

    const picked = selectCandidatesWithFairCap(all, { globalCap: 85, profileMeta: meta });
    assert.equal(picked.length, 85);

    const counts = new Map<string, number>();
    for (const row of picked) {
      counts.set(row.profileId, (counts.get(row.profileId) ?? 0) + 1);
    }
    assert.ok((counts.get("P22") ?? 0) > 0);
    assert.ok((counts.get("P1") ?? 0) <= 4);
    assert.ok((counts.get("P1") ?? 0) < 85);
  });

  it("dedupe is unchanged before fair cap", () => {
    const rows = [
      candidate("P1", "https://dup.example/a", 1),
      candidate("P2", "https://dup.example/a", 0.5),
    ];
    const { unique } = dedupeRunCandidates(rows);
    assert.equal(unique.length, 1);
    assert.equal(unique[0]?.profileId, "P1");
  });

  it("classification ordering interleaves high-intent profiles", () => {
    const meta = new Map<string, ProfileIntentMeta>([
      ["H1", { intentStrength: "high" }],
      ["M1", { intentStrength: "medium" }],
    ]);
    const rows = [
      candidate("M1", "https://m1.example/1", 1),
      candidate("M1", "https://m1.example/2", 0.9),
      candidate("H1", "https://h1.example/1", 0.8),
      candidate("H1", "https://h1.example/2", 0.7),
    ];
    const ordered = orderCandidatesForClassificationPass(rows, {
      maxClassifications: 45,
      profileMeta: meta,
    });
    assert.equal(ordered[0]?.profileId, "H1");
    assert.equal(ordered[1]?.profileId, "M1");
  });
});

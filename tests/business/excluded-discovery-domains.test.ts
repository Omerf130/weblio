import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hostnameMatchesExcludedDomain,
  isExcludedDiscoverySourceUrl,
} from "../../src/lib/discovery/excluded-discovery-domains";

const YOUTUBE_EXCLUDED = ["youtube.com", "www.youtube.com", "youtu.be"] as const;

describe("excluded discovery domains", () => {
  it("matches youtube host variants", () => {
    assert.equal(
      isExcludedDiscoverySourceUrl("https://www.youtube.com/watch?v=1", YOUTUBE_EXCLUDED),
      true
    );
    assert.equal(
      isExcludedDiscoverySourceUrl("https://m.youtube.com/watch?v=1", YOUTUBE_EXCLUDED),
      true
    );
    assert.equal(isExcludedDiscoverySourceUrl("https://youtu.be/abc", YOUTUBE_EXCLUDED), true);
  });

  it("does not exclude facebook, xplace, or forum-style hosts", () => {
    assert.equal(
      isExcludedDiscoverySourceUrl("https://www.facebook.com/groups/x", YOUTUBE_EXCLUDED),
      false
    );
    assert.equal(
      isExcludedDiscoverySourceUrl("https://www.xplace.com/item/1", YOUTUBE_EXCLUDED),
      false
    );
    assert.equal(
      isExcludedDiscoverySourceUrl("https://www.fxp.co.il/showthread.php?t=1", YOUTUBE_EXCLUDED),
      false
    );
  });

  it("matches subdomains of excluded root domains", () => {
    assert.equal(hostnameMatchesExcludedDomain("m.youtube.com", ["youtube.com"]), true);
  });
});

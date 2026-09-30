import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertRediscoveryUpdateDoesNotResetPreservedFields,
  buildFirstDiscoveryDocument,
  buildRediscoveryUpdate,
  REDISCOVERY_PRESERVED_FIELD_KEYS,
} from "../../src/lib/data/intent-rediscovery";

describe("intent rediscovery update logic", () => {
  it("buildRediscoveryUpdate only touches lastSeenAt and discoveryCount", () => {
    const now = new Date("2026-01-01T12:00:00.000Z");
    const update = buildRediscoveryUpdate(now);
    assert.deepEqual(update, {
      $set: { lastSeenAt: now },
      $inc: { discoveryCount: 1 },
    });
    assertRediscoveryUpdateDoesNotResetPreservedFields(update);
  });

  it("first discovery document defaults classification and status", () => {
    const now = new Date("2026-01-02T08:00:00.000Z");
    const doc = buildFirstDiscoveryDocument(
      {
        provider: "dev",
        externalId: "e1",
        content: "  hello world  ",
        title: "  title  ",
      },
      "provider:dev:e1",
      now
    );
    assert.equal(doc.discoveryCount, 1);
    assert.equal(doc.classification, "unclassified");
    assert.equal(doc.status, "new");
    assert.equal(doc.discoveredAt.toISOString(), now.toISOString());
    assert.equal(doc.lastSeenAt.toISOString(), now.toISOString());
    assert.equal(doc.content, "hello world");
    assert.equal(doc.title, "title");
  });

  it("persists content quality assessment on first discovery", () => {
    const now = new Date("2026-09-30T12:00:00.000Z");
    const doc = buildFirstDiscoveryDocument(
      {
        provider: "tavily",
        content: "Title: x\nImage 1\n## Other posts\nImage 2",
        sourceUrl: "https://www.facebook.com/groups/a/posts/b",
      },
      "url:https://www.facebook.com/groups/a/posts/b",
      now
    );
    assert.equal(doc.contentQuality, "aggregated_social");
    assert.ok(doc.contentQualityReasons?.includes("other_posts_section"));
  });

  it("documents preserved fields for rediscovery", () => {
    assert.ok(REDISCOVERY_PRESERVED_FIELD_KEYS.includes("classification"));
    assert.ok(REDISCOVERY_PRESERVED_FIELD_KEYS.includes("status"));
    assert.ok(REDISCOVERY_PRESERVED_FIELD_KEYS.includes("opportunityId"));
    assert.ok(REDISCOVERY_PRESERVED_FIELD_KEYS.includes("convertedAt"));
  });

  it("rejects rediscovery updates that set preserved fields", () => {
    assert.throws(() =>
      assertRediscoveryUpdateDoesNotResetPreservedFields({
        $set: { lastSeenAt: new Date(), status: "dismissed" },
        $inc: { discoveryCount: 1 },
      })
    );
  });
});

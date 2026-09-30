import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assessDiscoveryContentQuality,
  isFacebookDiscoverySource,
} from "../../src/lib/discovery/discovery-content-quality";

const FB_URL =
  "https://www.facebook.com/groups/1920854911477422/posts/4015397448689814";

describe("discovery content quality", () => {
  it("flags realistic mixed Facebook extraction as aggregated_social", () => {
    const content = [
      "Title: דרושים מתכנתים | מחפש בונה אתרים פרילאנס תותח | Facebook",
      "Image 1 ## # דרושים מתכנתים",
      "מחפש בונה אתרים פרילאנס תותח",
      "## Other posts",
      "### **מחפש שותף מתכנת לסטארטאפ**",
      "React Native",
      "Image 6: Site Market",
    ].join("\n");

    const result = assessDiscoveryContentQuality({
      content,
      sourceUrl: FB_URL,
      sourcePlatform: "www.facebook.com",
    });

    assert.equal(result.quality, "aggregated_social");
    assert.ok(result.reasons.includes("other_posts_section"));
  });

  it("keeps clean Facebook buyer post as normal", () => {
    const result = assessDiscoveryContentQuality({
      content: "היי, מחפש מישהו שיבנה לי אתר לעסק קטן. תודה!",
      sourceUrl: FB_URL,
    });
    assert.equal(result.quality, "normal");
    assert.deepEqual(result.reasons, []);
  });

  it("does not flag non-social Other posts phrase", () => {
    const result = assessDiscoveryContentQuality({
      content: "Other posts on this blog about pricing",
      sourceUrl: "https://example.com/blog/post",
    });
    assert.equal(result.quality, "normal");
  });

  it("does not flag Facebook with only one weak Image marker", () => {
    const result = assessDiscoveryContentQuality({
      content: "Image 1\nמחפש מישהו שיבנה לי אתר",
      sourceUrl: FB_URL,
    });
    assert.equal(result.quality, "normal");
  });

  it("detects facebook hosts consistently", () => {
    assert.equal(isFacebookDiscoverySource({ sourcePlatform: "www.facebook.com" }), true);
    assert.equal(isFacebookDiscoverySource({ sourcePlatform: "m.facebook.com" }), true);
    assert.equal(isFacebookDiscoverySource({ sourceUrl: FB_URL }), true);
    assert.equal(isFacebookDiscoverySource({ sourcePlatform: "instagram.com" }), false);
  });
});

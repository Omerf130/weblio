import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateDiscoveryCandidateQuality } from "../../src/lib/discovery/discovery-candidate-quality";
import type { PreIngestCandidate } from "../../src/lib/discovery/pre-ingest-filter";

function candidate(input: {
  title?: string;
  content?: string;
  sourceUrl?: string;
}): PreIngestCandidate {
  return {
    profileId: "K01",
    normalized: {
      provider: "tavily",
      title: input.title,
      content: input.content ?? input.title ?? "content",
      sourceUrl: input.sourceUrl,
    },
  };
}

describe("discovery candidate quality gate", () => {
  it("rejects first-run unsafe domain beastiality.tv", () => {
    const decision = evaluateDiscoveryCandidateQuality(
      candidate({
        title: "Dog porn - Beastiality TV",
        sourceUrl: "https://beastiality.tv/category/dog-porn",
        content: "unsafe snippet",
      })
    );
    assert.equal(decision.accepted, false);
    if (!decision.accepted) {
      assert.equal(decision.reason, "unsafe_adult");
    }
  });

  it("rejects obvious unsafe title without persisting graphic detail", () => {
    const decision = evaluateDiscoveryCandidateQuality(
      candidate({
        title: "Free adult tube videos",
        sourceUrl: "https://example.co.il/page",
        content: "מילים בעברית שלא מספיקות לבד",
      })
    );
    assert.equal(decision.accepted, false);
    if (!decision.accepted) {
      assert.equal(decision.reason, "unsafe_adult");
    }
  });

  it("allows normal Hebrew business content", () => {
    const decision = evaluateDiscoveryCandidateQuality(
      candidate({
        title: "מחפש מישהו שיבנה לי אתר לעסק קטן",
        sourceUrl: "https://example.co.il/post/1",
        content: "אני מחפש בונה אתרים לעסק שלי באזור המרכז",
      })
    );
    assert.equal(decision.accepted, true);
  });

  it("rejects Johnson & Johnson careers page from first run", () => {
    const decision = evaluateDiscoveryCandidateQuality(
      candidate({
        title: "Explore Johnson & Johnson careers in Israel",
        sourceUrl: "https://www.careers.jnj.com/he-il/locations/emea/israel",
        content: "Join our team",
      })
    );
    assert.equal(decision.accepted, false);
    if (!decision.accepted) {
      assert.equal(decision.reason, "jobs_careers");
    }
  });

  it("preserves Hebrew buyer looking for a website developer", () => {
    const decision = evaluateDiscoveryCandidateQuality(
      candidate({
        title: "מחפש מפתח אתרים שיבנה לי אתר",
        sourceUrl: "https://www.facebook.com/groups/example/posts/1",
        content:
          "שלום לכולם, אני מחפש מפתח אתרים שיבנה לי אתר לעסק קטן. מישהו מכיר?",
      })
    );
    assert.equal(decision.accepted, true);
  });

  it("rejects U.S. Chamber unrelated English corporate page", () => {
    const decision = evaluateDiscoveryCandidateQuality(
      candidate({
        title: "U.S. Chamber of Commerce",
        sourceUrl: "https://www.uschamber.com/",
        content: "Business advocacy organization",
      })
    );
    assert.equal(decision.accepted, false);
    if (!decision.accepted) {
      assert.equal(decision.reason, "non_israel_or_hebrew");
    }
  });

  it("rejects Wisconsin municipal .gov page", () => {
    const decision = evaluateDiscoveryCandidateQuality(
      candidate({
        title: "Home / De Pere, Wisconsin",
        sourceUrl: "https://www.deperewi.gov/",
        content: "Official municipal website",
      })
    );
    assert.equal(decision.accepted, false);
    if (!decision.accepted) {
      assert.equal(decision.reason, "non_israel_or_hebrew");
    }
  });

  it("allows Hebrew .il page", () => {
    const decision = evaluateDiscoveryCandidateQuality(
      candidate({
        title: "בונה אתרים לעסקים",
        sourceUrl: "https://example.co.il/services",
        content: "פתרונות אתרים",
      })
    );
    assert.equal(decision.accepted, true);
  });

  it("allows Hebrew Instagram content on international domain", () => {
    const decision = evaluateDiscoveryCandidateQuality(
      candidate({
        title: "מחפש המלצה על בונה אתרים",
        sourceUrl: "https://www.instagram.com/p/example/",
        content:
          "היי, אני מחפש מישהו שיבנה לי אתר לעסק קטן. יש המלצות על בונה אתרים אמין?",
      })
    );
    assert.equal(decision.accepted, true);
  });
});

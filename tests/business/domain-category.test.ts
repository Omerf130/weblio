import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { categorizePocDomain } from "../../src/lib/discovery/poc/domain-category";

describe("poc domain category (deterministic)", () => {
  it("labels major social hosts", () => {
    assert.equal(categorizePocDomain("facebook.com"), "social");
    assert.equal(categorizePocDomain("https://www.instagram.com/p/1"), "social");
  });

  it("labels video hosts", () => {
    assert.equal(categorizePocDomain("youtube.com"), "video");
    assert.equal(categorizePocDomain("https://youtu.be/abc"), "video");
  });

  it("labels forum/community hosts", () => {
    assert.equal(categorizePocDomain("fxp.co.il"), "forum/community");
    assert.equal(categorizePocDomain("forum.example.com"), "forum/community");
  });

  it("heuristically labels obvious service domains", () => {
    assert.equal(categorizePocDomain("agency.co.il"), "service/business-site");
  });

  it("uses other when unknown", () => {
    assert.equal(categorizePocDomain("example.com"), "other");
    assert.equal(categorizePocDomain(""), "other");
  });
});

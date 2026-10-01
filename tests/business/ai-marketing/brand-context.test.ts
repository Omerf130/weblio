import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatBrandContextForPrompt,
  getWeblioPunctuationInstructions,
  getWeblioVoiceInstructions,
  WEBLIO_BRAND_CONTEXT,
} from "../../../src/lib/business/ai-marketing/brand-context";

describe("brand context", () => {
  it("includes core brand fields in prompt text", () => {
    const text = formatBrandContextForPrompt(WEBLIO_BRAND_CONTEXT);
    assert.ok(text.includes("Weblio"));
    assert.ok(text.includes(WEBLIO_BRAND_CONTEXT.tagline));
    assert.ok(text.includes(WEBLIO_BRAND_CONTEXT.promptVersion));
    assert.ok(text.includes("שירותים:"));
    assert.ok(text.includes(WEBLIO_BRAND_CONTEXT.services[0]));
  });

  it("establishes first-person singular voice and preferred CTA", () => {
    const voice = getWeblioVoiceInstructions();
    const formatted = formatBrandContextForPrompt(WEBLIO_BRAND_CONTEXT);
    assert.ok(voice.includes("בניתי"));
    assert.ok(voice.includes("דברו איתי"));
    assert.ok(voice.includes("יצרנו"));
    assert.ok(formatted.includes("weblio-brand-v4"));
    assert.ok(WEBLIO_BRAND_CONTEXT.ctaPreferences.includes("דברו איתי"));
    assert.ok(voice.includes("לא המצאת"));
    assert.ok(WEBLIO_BRAND_CONTEXT.positioningNotes.includes("ביוגרפיות"));
  });

  it("prohibits em dash and en dash in punctuation instructions", () => {
    const punctuation = getWeblioPunctuationInstructions();
    const formatted = formatBrandContextForPrompt(WEBLIO_BRAND_CONTEXT);
    assert.ok(punctuation.includes("em dash"));
    assert.ok(punctuation.includes("en dash"));
    assert.ok(formatted.includes("פיסוק"));
    assert.ok(!WEBLIO_BRAND_CONTEXT.tagline.includes("\u2014"));
  });
});

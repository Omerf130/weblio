import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getFreeTopicBehaviorInstructions,
  getPersonalClaimSafetyInstructions,
  buildMarketingPromptMessages,
  getPurposeInstructionBlock,
} from "../../../src/lib/business/ai-marketing/prompt-builder";

describe("personal claim safety (phase 6E)", () => {
  it("global instructions forbid invented personal experiences", () => {
    const rules = getPersonalClaimSafetyInstructions();
    assert.ok(rules.includes("אסור להמציא"));
    assert.ok(rules.includes("למדתי"));
    assert.ok(rules.includes("חזרה לפרסום"));
    assert.ok(rules.includes("USER DATA"));
  });

  it("global instructions forbid invented habitual or frequency claims", () => {
    const rules = getPersonalClaimSafetyInstructions();
    assert.ok(rules.includes("תדירות/הרגל"));
    assert.ok(rules.includes("חוזר לנושא שוב ושוב"));
    assert.ok(rules.includes("תמיד אומר ללקוחות"));
    assert.ok(rules.includes("שואלים אותי הרבה"));
    assert.ok(rules.includes("חשוב כמעט לכל עסק עם אתר"));
    assert.ok(rules.includes("אני חוזר אליו שוב ושוב"));
  });

  it("LinkedIn prompt does not encourage fake lessons or return narrative", () => {
    const linkedin = getPurposeInstructionBlock("linkedinPost");
    assert.ok(linkedin.includes("אסור"));
    assert.ok(linkedin.includes("למדתי") || linkedin.includes("לקוחות"));
    assert.ok(linkedin.includes("חוזר אליו שוב ושוב"));
    assert.ok(!linkedin.toLowerCase().includes("share your journey"));
  });

  it("free-topic behavior supports topic discovery without requiring finalized topic", () => {
    const behavior = getFreeTopicBehaviorInstructions();
    assert.ok(behavior.includes("אין לי רעיון") || behavior.includes("תמצא"));
    assert.ok(behavior.includes("אל תמציא סיפור אישי"));
  });

  it("includes free-topic behavior block for LinkedIn freeTopic generation", () => {
    const { system } = buildMarketingPromptMessages({
      purpose: "linkedinPost",
      source: "freeTopic",
      userInstruction: "לא פרסמתי הרבה זמן, תמצא נושא על אתרים",
      language: "he",
    });
    assert.ok(system.includes("FREE TOPIC BEHAVIOR"));
    assert.ok(system.includes("ACCURACY & SAFETY"));
    assert.ok(system.includes("WEBLIO BRAND CONTEXT"));
  });

  it("Story remains short-form oriented", () => {
    const story = getPurposeInstructionBlock("story");
    assert.ok(story.includes("1-3"));
    assert.ok(story.includes("לא פוסט מלא"));
  });

  it("Content ideas asks for varied actionable ideas", () => {
    const ideas = getPurposeInstructionBlock("contentIdeas");
    assert.ok(ideas.includes("גיוון"));
  });

  it("Rewrite preserves meaning without adding facts", () => {
    const rewrite = getPurposeInstructionBlock("rewrite");
    assert.ok(rewrite.includes("אל תוסיף עובדות"));
  });
});

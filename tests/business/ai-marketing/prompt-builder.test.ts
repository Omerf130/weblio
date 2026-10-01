import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildMarketingPromptMessages,
  getMarketingAccuracyInstructions,
  getPersonalClaimSafetyInstructions,
  getPurposeInstructionBlock,
} from "../../../src/lib/business/ai-marketing/prompt-builder";
import { mapAdminProjectToMarketingContext } from "../../../src/lib/business/ai-marketing/project-marketing-context";
import type { AdminProjectDto } from "../../../src/types/project";

const projectDto: AdminProjectDto = {
  id: "507f1f77bcf86cd799439011",
  title: "דוגמה",
  subtitle: "",
  projectUrl: "https://example.com",
  ctaLabel: "Go",
  imageUrl: "https://example.com/i.png",
  imageAlt: "x",
  isPublished: true,
  showOnHome: false,
  showOnProjectsPage: true,
  homeOrder: 0,
  projectsPageOrder: 0,
  technologies: [],
  updatedAt: "2026-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("marketing prompt builder", () => {
  it("includes fabrication guard instructions", () => {
    const accuracy = getMarketingAccuracyInstructions();
    assert.ok(accuracy.includes("אל תמציא"));
    assert.ok(accuracy.includes("מדדים"));
    assert.ok(accuracy.includes("PROJECT DATA"));
    const personal = getPersonalClaimSafetyInstructions();
    assert.ok(accuracy.includes(personal));
    assert.ok(personal.includes("אסור להמציא"));
  });

  it("selects purpose-specific website instructions", () => {
    const block = getPurposeInstructionBlock("websiteProjectContent");
    assert.ok(block.includes("JSON"));
    assert.ok(block.includes("technologies"));
    assert.ok(block.includes("אסור להמציא"));
  });

  it("keeps social and linkedin prompts distinct", () => {
    const social = getPurposeInstructionBlock("socialPost");
    const linkedin = getPurposeInstructionBlock("linkedinPost");
    assert.notEqual(social, linkedin);
    assert.ok(social.includes("Instagram/Facebook"));
    assert.ok(linkedin.includes("LinkedIn"));
  });

  it("delimits project data and excludes raw mongo id from prompt user block", () => {
    const project = mapAdminProjectToMarketingContext(projectDto);
    const { user, system } = buildMarketingPromptMessages(
      {
        purpose: "websiteProjectContent",
        source: "project",
        projectId: projectDto.id,
        language: "he",
      },
      project
    );

    assert.ok(user.includes("---BEGIN PROJECT DATA---"));
    assert.ok(user.includes("---END PROJECT DATA---"));
    assert.ok(user.includes('"title": "דוגמה"'));
    assert.ok(!user.includes(projectDto.id));
    assert.ok(system.includes("WEBLIO BRAND CONTEXT"));
  });

  it("includes voice, social cliché avoidance, and factual grounding in system prompt", () => {
    const project = mapAdminProjectToMarketingContext(projectDto);
    const { system } = buildMarketingPromptMessages(
      {
        purpose: "socialPost",
        source: "project",
        projectId: projectDto.id,
        language: "he",
      },
      project
    );

    assert.ok(system.includes("גוף ראשון יחיד"));
    assert.ok(system.includes("דברו איתי"));
    assert.ok(system.includes("מתרגש לשתף"));
    assert.ok(system.includes("ACCURACY & SAFETY"));
    assert.ok(system.includes("אל תמציא"));
  });

  it("wraps freeform instruction as user data", () => {
    const { user } = buildMarketingPromptMessages({
      purpose: "freeform",
      source: "freeTopic",
      userInstruction: "כתוב על אתרים לעסקים",
      language: "he",
    });
    assert.ok(user.includes("---BEGIN USER DATA---"));
    assert.ok(user.includes("כתוב על אתרים לעסקים"));
  });
});

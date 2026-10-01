import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateMarketingDraft } from "../../../src/lib/business/ai-marketing/generate-marketing-draft";
import { createOpenAIMarketingGenerator } from "../../../src/lib/business/ai-marketing/openai-marketing-generator";
import { DEFAULT_OPENAI_MARKETING_MODEL } from "../../../src/lib/business/ai-marketing/openai-marketing-env";
import type { AdminProjectDto } from "../../../src/types/project";

const projectId = "507f1f77bcf86cd799439011";

const mockProject: AdminProjectDto = {
  id: projectId,
  title: "פרויקט",
  subtitle: "תת",
  projectUrl: "https://example.com",
  ctaLabel: "Go",
  imageUrl: "https://example.com/i.png",
  imageAlt: "x",
  isPublished: true,
  showOnHome: false,
  showOnProjectsPage: true,
  homeOrder: 0,
  projectsPageOrder: 0,
  technologies: ["React"],
  updatedAt: "2026-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("generate marketing draft orchestrator", () => {
  it("returns disabled when marketing env is off", async () => {
    const result = await generateMarketingDraft(
      {
        purpose: "freeform",
        source: "freeTopic",
        userInstruction: "hello",
        language: "he",
      },
      {
        resolveEnv: () => null,
        getProjectById: async () => null,
        getClient: () => null,
        createGenerator: createOpenAIMarketingGenerator,
      }
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "disabled");
    }
  });

  it("returns project_not_found when project id is missing in db", async () => {
    const result = await generateMarketingDraft(
      {
        purpose: "socialPost",
        source: "project",
        projectId,
        language: "he",
      },
      {
        resolveEnv: () => ({
          apiKey: "sk-test",
          model: DEFAULT_OPENAI_MARKETING_MODEL,
          timeoutMs: 5000,
          maxOutputTokens: 512,
        }),
        getProjectById: async () => null,
        getClient: () => null,
        createGenerator: createOpenAIMarketingGenerator,
      },
      createOpenAIMarketingGenerator({
        model: DEFAULT_OPENAI_MARKETING_MODEL,
        timeoutMs: 5000,
        maxOutputTokens: 512,
        responsesCreate: async () => ({
          output_text: JSON.stringify({ content: "x" }),
        }),
      })
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "project_not_found");
    }
  });

  it("generates content when env and project exist", async () => {
    const generator = createOpenAIMarketingGenerator({
      model: DEFAULT_OPENAI_MARKETING_MODEL,
      timeoutMs: 5000,
      maxOutputTokens: 512,
      responsesCreate: async () => ({
        output_text: JSON.stringify({ content: "פוסט מהפרויקט" }),
      }),
    });

    const result = await generateMarketingDraft(
      {
        purpose: "socialPost",
        source: "project",
        projectId,
        language: "he",
      },
      {
        resolveEnv: () => ({
          apiKey: "sk-test",
          model: DEFAULT_OPENAI_MARKETING_MODEL,
          timeoutMs: 5000,
          maxOutputTokens: 512,
        }),
        getProjectById: async () => mockProject,
        getClient: () => null,
        createGenerator: createOpenAIMarketingGenerator,
      },
      generator
    );

    assert.equal(result.ok, true);
    if (result.ok && result.kind === "content") {
      assert.equal(result.content, "פוסט מהפרויקט");
    }
  });

  it("generates websiteContent for websiteProjectContent purpose", async () => {
    const generator = createOpenAIMarketingGenerator({
      model: DEFAULT_OPENAI_MARKETING_MODEL,
      timeoutMs: 5000,
      maxOutputTokens: 512,
      responsesCreate: async () => ({
        output_text: JSON.stringify({
          title: "כותרת",
          subtitle: "תת",
          description: "תיאור",
          homeTitle: "",
          homeSubtitle: "",
          technologies: ["React"],
        }),
      }),
    });

    const result = await generateMarketingDraft(
      {
        purpose: "websiteProjectContent",
        source: "project",
        projectId,
        language: "he",
      },
      {
        resolveEnv: () => ({
          apiKey: "sk-test",
          model: DEFAULT_OPENAI_MARKETING_MODEL,
          timeoutMs: 5000,
          maxOutputTokens: 512,
        }),
        getProjectById: async () => mockProject,
        getClient: () => null,
        createGenerator: createOpenAIMarketingGenerator,
      },
      generator
    );

    assert.equal(result.ok, true);
    if (result.ok && result.kind === "websiteContent") {
      assert.equal(result.websiteContent.title, "כותרת");
    }
  });
});

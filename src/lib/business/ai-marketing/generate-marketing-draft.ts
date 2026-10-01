import { getProjectById } from "@/lib/data/projects";
import { getOpenAIMarketingClient } from "@/lib/business/ai-marketing/openai-marketing-client";
import {
  createOpenAIMarketingGenerator,
  type OpenAIMarketingGenerator,
} from "@/lib/business/ai-marketing/openai-marketing-generator";
import { resolveOpenAIMarketingEnv } from "@/lib/business/ai-marketing/openai-marketing-env";
import { mapAdminProjectToMarketingContext } from "@/lib/business/ai-marketing/project-marketing-context";
import type { GenerateMarketingDraftResult } from "@/lib/business/ai-marketing/types";
import { marketingInputUsesProjectSource } from "@/lib/business/ai-marketing/types";
import type { MarketingGenerationInput } from "@/lib/business/ai-marketing/validations";

export type GenerateMarketingDraftDeps = {
  getProjectById: typeof getProjectById;
  resolveEnv: typeof resolveOpenAIMarketingEnv;
  getClient: typeof getOpenAIMarketingClient;
  createGenerator: typeof createOpenAIMarketingGenerator;
};

const defaultDeps: GenerateMarketingDraftDeps = {
  getProjectById,
  resolveEnv: resolveOpenAIMarketingEnv,
  getClient: getOpenAIMarketingClient,
  createGenerator: createOpenAIMarketingGenerator,
};

function getProjectIdFromInput(input: MarketingGenerationInput): string | undefined {
  if ("projectId" in input && typeof input.projectId === "string") {
    return input.projectId;
  }
  return undefined;
}

export async function generateMarketingDraft(
  input: MarketingGenerationInput,
  partialDeps?: Partial<GenerateMarketingDraftDeps>,
  injectedGenerator?: OpenAIMarketingGenerator
): Promise<GenerateMarketingDraftResult> {
  const deps = { ...defaultDeps, ...partialDeps };
  const env = deps.resolveEnv();

  if (!env) {
    return {
      ok: false,
      reason: "disabled",
      message: "AI Marketing לא מופעל או חסר מפתח API.",
    };
  }

  let projectContext;
  if (marketingInputUsesProjectSource(input)) {
    const projectId = getProjectIdFromInput(input);
    if (!projectId) {
      return {
        ok: false,
        reason: "invalid_input",
        message: "נדרש מזהה פרויקט.",
      };
    }

    const project = await deps.getProjectById(projectId);
    if (!project) {
      return {
        ok: false,
        reason: "project_not_found",
        message: "פרויקט לא נמצא.",
      };
    }

    projectContext = mapAdminProjectToMarketingContext(project);
  }

  const generator =
    injectedGenerator ??
    (() => {
      const client = deps.getClient();
      if (!client) {
        return null;
      }
      return deps.createGenerator({
        model: env.model,
        timeoutMs: env.timeoutMs,
        maxOutputTokens: env.maxOutputTokens,
        responsesCreate: (body, options) => client.responses.create(body, options),
      });
    })();

  if (!generator) {
    return {
      ok: false,
      reason: "disabled",
      message: "AI Marketing לא מופעל או חסר מפתח API.",
    };
  }

  const result = await generator.generate(input, projectContext);
  if (!result) {
    return {
      ok: false,
      reason: "generation_failed",
      message: "לא ניתן ליצור טיוטה כרגע. נסה שוב מאוחר יותר.",
    };
  }

  if (result.kind === "ideas") {
    return { ok: true, kind: "ideas", ideas: result.ideas };
  }

  if (result.kind === "websiteContent") {
    return {
      ok: true,
      kind: "websiteContent",
      websiteContent: result.websiteContent,
    };
  }

  return { ok: true, kind: "content", content: result.content };
}

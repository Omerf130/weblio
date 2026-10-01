import OpenAI from "openai";
import { APIError } from "openai";
import {
  MARKETING_CONTENT_JSON_SCHEMA,
  MARKETING_CONTENT_SCHEMA_NAME,
  MARKETING_IDEAS_JSON_SCHEMA,
  MARKETING_IDEAS_SCHEMA_NAME,
  MARKETING_WEBSITE_CONTENT_JSON_SCHEMA,
  MARKETING_WEBSITE_CONTENT_SCHEMA_NAME,
} from "@/lib/business/ai-marketing/marketing-output-schema";
import {
  buildMarketingPromptMessages,
  type MarketingPromptMessages,
} from "@/lib/business/ai-marketing/prompt-builder";
import type { ProjectMarketingContext } from "@/lib/business/ai-marketing/project-marketing-context";
import { normalizeMarketingGenerationSuccess } from "@/lib/business/ai-marketing/normalize-marketing-copy";
import type {
  MarketingGenerationSuccess,
  MarketingPurpose,
  WebsiteProjectContentFields,
} from "@/lib/business/ai-marketing/types";
import type { MarketingGenerationInput } from "@/lib/business/ai-marketing/validations";
import { z } from "zod";

const RETRYABLE_STATUS_CODES = new Set([429, 503]);
const RETRY_DELAY_MS = 1500;

const contentOutputSchema = z.object({
  content: z.string().trim().min(1),
});

const ideasOutputSchema = z.object({
  ideas: z.array(z.string().trim().min(1)).min(5).max(8),
});

const websiteTechnologySchema = z.string().trim().min(1).max(40);

const websiteOutputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(200),
  description: z.string().trim().max(300).optional(),
  homeTitle: z.string().trim().max(120).optional(),
  homeSubtitle: z.string().trim().max(200).optional(),
  technologies: z.array(websiteTechnologySchema).max(20).default([]),
});

export type OpenAIMarketingResponsesCreate = (
  body: OpenAI.Responses.ResponseCreateParamsNonStreaming,
  options?: OpenAI.RequestOptions
) => Promise<OpenAI.Responses.Response>;

export type CreateOpenAIMarketingGeneratorOptions = {
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
  responsesCreate: OpenAIMarketingResponsesCreate;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableApiError(error: unknown): boolean {
  if (error instanceof APIError && typeof error.status === "number") {
    return RETRYABLE_STATUS_CODES.has(error.status);
  }
  return false;
}

function logMarketingFailure(message: string): void {
  console.warn(`[ai-marketing] ${message}`);
}

async function callResponsesWithRetry(
  responsesCreate: OpenAIMarketingResponsesCreate,
  body: OpenAI.Responses.ResponseCreateParamsNonStreaming,
  timeoutMs: number
): Promise<OpenAI.Responses.Response | null> {
  const requestOptions: OpenAI.RequestOptions = {
    timeout: timeoutMs,
    signal: AbortSignal.timeout(timeoutMs),
  };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await responsesCreate(body, requestOptions);
    } catch (error) {
      if (attempt === 0 && isRetryableApiError(error)) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }

      if (error instanceof APIError) {
        logMarketingFailure(
          `API error (status ${error.status ?? "unknown"}): generation failed.`
        );
      } else if (error instanceof Error && error.name === "TimeoutError") {
        logMarketingFailure("Request timed out: generation failed.");
      } else if (error instanceof Error && error.name === "AbortError") {
        logMarketingFailure("Request aborted (timeout): generation failed.");
      } else {
        logMarketingFailure("Unexpected error: generation failed.");
      }

      return null;
    }
  }

  return null;
}

function parseJsonOutput<T>(
  outputText: string | undefined | null,
  schema: z.ZodType<T>
): T | null {
  if (!outputText?.trim()) {
    return null;
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(outputText);
  } catch {
    return null;
  }

  const parsed = schema.safeParse(parsedJson);
  return parsed.success ? parsed.data : null;
}

function normalizeWebsiteFields(
  raw: z.infer<typeof websiteOutputSchema>
): WebsiteProjectContentFields {
  return {
    title: raw.title,
    subtitle: raw.subtitle,
    description: raw.description?.trim() || undefined,
    homeTitle: raw.homeTitle?.trim() || undefined,
    homeSubtitle: raw.homeSubtitle?.trim() || undefined,
    technologies: raw.technologies ?? [],
  };
}

type OutputFormatKind = "website" | "ideas" | "content";

function getOutputFormatKind(purpose: MarketingPurpose): OutputFormatKind {
  if (purpose === "websiteProjectContent") {
    return "website";
  }
  if (purpose === "contentIdeas") {
    return "ideas";
  }
  return "content";
}

export function createOpenAIMarketingGenerator(
  options: CreateOpenAIMarketingGeneratorOptions
) {
  return {
    async generate(
      input: MarketingGenerationInput,
      project?: ProjectMarketingContext
    ): Promise<MarketingGenerationSuccess | null> {
      const messages: MarketingPromptMessages = buildMarketingPromptMessages(
        input,
        project
      );

      const formatKind = getOutputFormatKind(input.purpose);

      const textFormat =
        formatKind === "website"
          ? {
              type: "json_schema" as const,
              name: MARKETING_WEBSITE_CONTENT_SCHEMA_NAME,
              strict: true,
              schema: MARKETING_WEBSITE_CONTENT_JSON_SCHEMA,
            }
          : formatKind === "ideas"
            ? {
                type: "json_schema" as const,
                name: MARKETING_IDEAS_SCHEMA_NAME,
                strict: true,
                schema: MARKETING_IDEAS_JSON_SCHEMA,
              }
            : {
                type: "json_schema" as const,
                name: MARKETING_CONTENT_SCHEMA_NAME,
                strict: true,
                schema: MARKETING_CONTENT_JSON_SCHEMA,
              };

      const body: OpenAI.Responses.ResponseCreateParamsNonStreaming = {
        model: options.model,
        max_output_tokens: options.maxOutputTokens,
        input: [
          { role: "system", content: messages.system },
          { role: "user", content: messages.user },
        ],
        text: { format: textFormat },
      };

      const response = await callResponsesWithRetry(
        options.responsesCreate,
        body,
        options.timeoutMs
      );

      if (!response) {
        return null;
      }

      if (formatKind === "website") {
        const websiteOutput = parseJsonOutput(
          response.output_text,
          websiteOutputSchema
        );
        if (!websiteOutput) {
          logMarketingFailure("Invalid website output: generation failed.");
          return null;
        }
        return normalizeMarketingGenerationSuccess({
          kind: "websiteContent",
          websiteContent: normalizeWebsiteFields(websiteOutput),
        });
      }

      if (formatKind === "ideas") {
        const ideasOutput = parseJsonOutput(
          response.output_text,
          ideasOutputSchema
        );
        if (!ideasOutput) {
          logMarketingFailure("Invalid ideas output: generation failed.");
          return null;
        }
        return normalizeMarketingGenerationSuccess({
          kind: "ideas",
          ideas: ideasOutput.ideas,
        });
      }

      const contentOutput = parseJsonOutput(
        response.output_text,
        contentOutputSchema
      );
      if (!contentOutput) {
        logMarketingFailure("Invalid content output: generation failed.");
        return null;
      }

      return normalizeMarketingGenerationSuccess({
        kind: "content",
        content: contentOutput.content,
      });
    },
  };
}

export type OpenAIMarketingGenerator = ReturnType<
  typeof createOpenAIMarketingGenerator
>;

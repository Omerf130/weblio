import OpenAI from "openai";
import { APIError } from "openai";
import {
  buildOpenAIClassifierVersion,
  type ResolvedOpenAIIntentEnv,
} from "@/lib/discovery/classifier/openai-env";
import {
  INTENT_CLASSIFICATION_JSON_SCHEMA,
  INTENT_CLASSIFICATION_SCHEMA_NAME,
} from "@/lib/discovery/classifier/intent-classification-json-schema";
import { buildOpenAIIntentClassificationMessages } from "@/lib/discovery/classifier/openai-prompt";
import { safeParseIntentClassifierResult } from "@/lib/discovery/classifier/parse-result";
import type {
  IntentClassifier,
  IntentClassifierInput,
  IntentClassifierResult,
} from "@/lib/discovery/classifier/types";
import { z } from "zod";

const RETRYABLE_STATUS_CODES = new Set([429, 503]);
const RETRY_DELAY_MS = 1500;

const modelOutputSchema = z.object({
  classification: z.enum(["explicitNeed", "possibleNeed", "irrelevant"]),
  reason: z.string().trim().min(1).max(500),
});

export type OpenAIResponsesCreate = (
  body: OpenAI.Responses.ResponseCreateParamsNonStreaming,
  options?: OpenAI.RequestOptions
) => Promise<OpenAI.Responses.Response>;

export type CreateOpenAIIntentClassifierOptions = {
  model: string;
  timeoutMs: number;
  responsesCreate: OpenAIResponsesCreate;
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

function logClassificationFailure(message: string): void {
  console.warn(`[openai-intent] ${message}`);
}

function parseModelOutputText(
  outputText: string | undefined | null
): z.infer<typeof modelOutputSchema> | null {
  if (!outputText?.trim()) {
    return null;
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(outputText);
  } catch {
    return null;
  }

  const parsed = modelOutputSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

async function callResponsesWithRetry(
  responsesCreate: OpenAIResponsesCreate,
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
        logClassificationFailure(
          `API error (status ${error.status ?? "unknown"}): classification skipped.`
        );
      } else if (error instanceof Error && error.name === "TimeoutError") {
        logClassificationFailure("Request timed out: classification skipped.");
      } else if (error instanceof Error && error.name === "AbortError") {
        logClassificationFailure("Request aborted (timeout): classification skipped.");
      } else {
        logClassificationFailure("Unexpected error: classification skipped.");
      }

      return null;
    }
  }

  return null;
}

export function createOpenAIIntentClassifier(
  options: CreateOpenAIIntentClassifierOptions
): IntentClassifier {
  const classifierVersion = buildOpenAIClassifierVersion(options.model);

  return {
    async classify(
      input: IntentClassifierInput
    ): Promise<IntentClassifierResult | null> {
      const { system, user } = buildOpenAIIntentClassificationMessages(input);

      const body: OpenAI.Responses.ResponseCreateParamsNonStreaming = {
        model: options.model,
        input: [
          {
            role: "system",
            content: system,
          },
          {
            role: "user",
            content: user,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: INTENT_CLASSIFICATION_SCHEMA_NAME,
            strict: true,
            schema: INTENT_CLASSIFICATION_JSON_SCHEMA,
          },
        },
      };

      const response = await callResponsesWithRetry(
        options.responsesCreate,
        body,
        options.timeoutMs
      );

      if (!response) {
        return null;
      }

      const modelOutput = parseModelOutputText(response.output_text);
      if (!modelOutput) {
        logClassificationFailure("Invalid model output: classification skipped.");
        return null;
      }

      const withVersion: IntentClassifierResult = {
        classification: modelOutput.classification,
        reason: modelOutput.reason,
        classifierVersion,
      };

      const validated = safeParseIntentClassifierResult(withVersion);
      if (!validated.ok) {
        logClassificationFailure("Output failed validation: classification skipped.");
        return null;
      }

      return validated.data;
    },
  };
}

export function createOpenAIIntentClassifierFromEnv(
  env: ResolvedOpenAIIntentEnv,
  client: OpenAI
): IntentClassifier {
  return createOpenAIIntentClassifier({
    model: env.model,
    timeoutMs: env.timeoutMs,
    responsesCreate: (body, options) => client.responses.create(body, options),
  });
}

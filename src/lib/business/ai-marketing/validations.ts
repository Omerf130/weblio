import { z } from "zod";
import {
  MARKETING_PURPOSES,
  REWRITE_TRANSFORMATIONS,
} from "@/lib/business/ai-marketing/types";

export const MAX_MARKETING_USER_INSTRUCTION_CHARS = 2000;
export const MAX_MARKETING_SOURCE_TEXT_CHARS = 8000;

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid project id");

const optionalInstructionSchema = z
  .string()
  .trim()
  .max(MAX_MARKETING_USER_INSTRUCTION_CHARS)
  .optional()
  .transform((value) => (value === "" ? undefined : value));

const requiredTopicSchema = z
  .string()
  .trim()
  .min(1, "Instruction is required")
  .max(MAX_MARKETING_USER_INSTRUCTION_CHARS);

const languageSchema = z.literal("he").optional().default("he");

const websiteProjectContentSchema = z.object({
  purpose: z.literal("websiteProjectContent"),
  source: z.literal("project"),
  projectId: objectIdSchema,
  userInstruction: optionalInstructionSchema,
  language: languageSchema,
});

const socialPostProjectSchema = z.object({
  purpose: z.literal("socialPost"),
  source: z.literal("project"),
  projectId: objectIdSchema,
  userInstruction: optionalInstructionSchema,
  language: languageSchema,
});

const socialPostFreeTopicSchema = z.object({
  purpose: z.literal("socialPost"),
  source: z.literal("freeTopic"),
  userInstruction: requiredTopicSchema,
  language: languageSchema,
});

const linkedinPostProjectSchema = z.object({
  purpose: z.literal("linkedinPost"),
  source: z.literal("project"),
  projectId: objectIdSchema,
  userInstruction: optionalInstructionSchema,
  language: languageSchema,
});

const linkedinPostFreeTopicSchema = z.object({
  purpose: z.literal("linkedinPost"),
  source: z.literal("freeTopic"),
  userInstruction: requiredTopicSchema,
  language: languageSchema,
});

const storyProjectSchema = z.object({
  purpose: z.literal("story"),
  source: z.literal("project"),
  projectId: objectIdSchema,
  userInstruction: optionalInstructionSchema,
  language: languageSchema,
});

const storyFreeTopicSchema = z.object({
  purpose: z.literal("story"),
  source: z.literal("freeTopic"),
  userInstruction: requiredTopicSchema,
  language: languageSchema,
});

const contentIdeasGlobalSchema = z.object({
  purpose: z.literal("contentIdeas"),
  source: z.literal("globalWeblio"),
  userInstruction: optionalInstructionSchema,
  language: languageSchema,
});

const contentIdeasProjectSchema = z.object({
  purpose: z.literal("contentIdeas"),
  source: z.literal("project"),
  projectId: objectIdSchema,
  userInstruction: optionalInstructionSchema,
  language: languageSchema,
});

const rewriteSchema = z.object({
  purpose: z.literal("rewrite"),
  source: z.literal("sourceText"),
  sourceText: z
    .string()
    .trim()
    .min(1, "Source text is required")
    .max(MAX_MARKETING_SOURCE_TEXT_CHARS),
  transformation: z.enum(REWRITE_TRANSFORMATIONS),
  userInstruction: optionalInstructionSchema,
  language: languageSchema,
});

const freeformSchema = z.object({
  purpose: z.literal("freeform"),
  source: z.literal("freeTopic"),
  userInstruction: requiredTopicSchema,
  language: languageSchema,
});

export const marketingGenerationInputSchema = z.union([
  websiteProjectContentSchema,
  socialPostProjectSchema,
  socialPostFreeTopicSchema,
  linkedinPostProjectSchema,
  linkedinPostFreeTopicSchema,
  storyProjectSchema,
  storyFreeTopicSchema,
  contentIdeasGlobalSchema,
  contentIdeasProjectSchema,
  rewriteSchema,
  freeformSchema,
]);

export type MarketingGenerationInput = z.infer<typeof marketingGenerationInputSchema>;

export function safeParseMarketingGenerationInput(value: unknown) {
  return marketingGenerationInputSchema.safeParse(value);
}

export function isKnownMarketingPurpose(
  value: string
): value is (typeof MARKETING_PURPOSES)[number] {
  return (MARKETING_PURPOSES as readonly string[]).includes(value);
}

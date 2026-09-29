import { z } from "zod";
import { validateRawMetadata } from "@/lib/discovery/raw-metadata";
import {
  INTENT_CLASSIFICATIONS,
  INTENT_SOURCE_TYPES,
  INTENT_STATUSES,
} from "@/types/intent";
import { MANUAL_INTENT_STATUSES } from "@/lib/business/intents/rules";

const objectIdPattern = /^[a-f\d]{24}$/i;

function optionalTrimmedString(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));
}

const optionalHttpsUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined))
  .pipe(
    z
      .string()
      .url("כתובת URL לא תקינה")
      .refine((value) => value.startsWith("https://"), {
        message: "כתובת URL חייבת להתחיל ב-https://",
      })
      .optional()
  );

const rawMetadataSchema = z
  .unknown()
  .optional()
  .superRefine((value, ctx) => {
    const result = validateRawMetadata(value);
    if (!result.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          result.reason === "too_large"
            ? "מטא-דאטה גדול מדי"
            : "מטא-דאטה לא תקין",
      });
    }
  })
  .transform((value) => {
    const result = validateRawMetadata(value);
    return result.ok ? result.value : undefined;
  });

export const normalizedDiscoveryInputSchema = z
  .object({
    provider: z
      .string()
      .trim()
      .min(1, "נדרש provider")
      .max(40, "provider ארוך מדי")
      .transform((value) => value.toLowerCase()),
    externalId: optionalTrimmedString(256),
    sourceType: z.enum(INTENT_SOURCE_TYPES).optional(),
    sourcePlatform: optionalTrimmedString(80),
    sourceUrl: optionalHttpsUrlSchema,
    title: optionalTrimmedString(300),
    content: z
      .string()
      .trim()
      .min(1, "נדרש תוכן")
      .max(10_000, "התוכן ארוך מדי"),
    authorDisplayName: optionalTrimmedString(120),
    publishedAt: z.coerce.date().optional(),
    rawMetadata: rawMetadataSchema,
  })
  .superRefine((data, ctx) => {
    if (!data.externalId && !data.sourceUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "נדרש externalId או sourceUrl",
        path: ["externalId"],
      });
    }
  });

export type NormalizedDiscoveryInputParsed = z.infer<
  typeof normalizedDiscoveryInputSchema
>;

export const updateIntentClassificationSchema = z.object({
  intentId: z.string().regex(objectIdPattern, "מזהה Intent לא תקין"),
  classification: z.enum(INTENT_CLASSIFICATIONS),
  classificationReason: optionalTrimmedString(500),
  classifierVersion: optionalTrimmedString(64),
});

export type UpdateIntentClassificationInput = z.infer<
  typeof updateIntentClassificationSchema
>;

export const setIntentStatusSchema = z.object({
  intentId: z.string().regex(objectIdPattern, "מזהה Intent לא תקין"),
  status: z.enum(MANUAL_INTENT_STATUSES),
});

export type SetIntentStatusInput = z.infer<typeof setIntentStatusSchema>;

export function safeParseNormalizedDiscoveryInput(input: unknown) {
  return normalizedDiscoveryInputSchema.safeParse(input);
}

export function safeParseUpdateIntentClassification(input: unknown) {
  return updateIntentClassificationSchema.safeParse(input);
}

export function safeParseSetIntentStatus(input: unknown) {
  return setIntentStatusSchema.safeParse(input);
}

export function isValidIntentObjectId(value: string): boolean {
  return objectIdPattern.test(value);
}

/** For tests and list-url parsing of status enum values. */
export const intentStatusEnumSchema = z.enum(INTENT_STATUSES);

export const intentClassificationEnumSchema = z.enum(INTENT_CLASSIFICATIONS);

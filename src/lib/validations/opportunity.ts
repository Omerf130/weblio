import { z } from "zod";
import { MANUAL_OPPORTUNITY_STATUSES } from "@/lib/business/opportunities/rules";
import {
  OPPORTUNITY_CLASSIFICATIONS,
  OPPORTUNITY_SOURCES,
} from "@/types/opportunity";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const objectIdPattern = /^[a-f\d]{24}$/i;

function optionalTrimmedString(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));
}

const optionalPhoneSchema = z
  .string()
  .trim()
  .max(30)
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined))
  .pipe(
    z
      .string()
      .refine((value) => /^[\d\s\-+()]+$/.test(value), "מספר טלפון לא תקין")
      .refine((value) => value.replace(/\D/g, "").length >= 9, "מספר טלפון לא תקין")
      .optional()
  );

const optionalEmailSchema = z
  .string()
  .trim()
  .max(254)
  .optional()
  .transform((value) => (value && value.length > 0 ? value.toLowerCase() : undefined))
  .pipe(
    z
      .string()
      .refine((value) => EMAIL_PATTERN.test(value), "כתובת מייל לא תקינה")
      .optional()
  );

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

const optionalExternalSourceIdSchema = optionalTrimmedString(256);

export const createOpportunitySchema = z.object({
  title: z.string().trim().min(1, "נא להזין כותרת").max(200, "הכותרת ארוכה מדי"),
  businessName: optionalTrimmedString(200),
  contactName: optionalTrimmedString(120),
  phone: optionalPhoneSchema,
  email: optionalEmailSchema,
  source: z.enum(OPPORTUNITY_SOURCES),
  classification: z.enum(OPPORTUNITY_CLASSIFICATIONS),
  sourceUrl: optionalHttpsUrlSchema,
  sourcePlatform: optionalTrimmedString(80),
  description: optionalTrimmedString(2000),
  relevanceNote: optionalTrimmedString(2000),
  internalNotes: z
    .string()
    .trim()
    .max(5000, "הערות פנימיות ארוכות מדי")
    .optional()
    .transform((value) => value ?? ""),
  externalSourceId: optionalExternalSourceIdSchema,
});

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;

export const updateOpportunitySchema = createOpportunitySchema;

export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;

export const updateOpportunityStatusSchema = z.object({
  status: z.enum(MANUAL_OPPORTUNITY_STATUSES),
});

export type UpdateOpportunityStatusInput = z.infer<
  typeof updateOpportunityStatusSchema
>;

export function safeParseCreateOpportunity(input: unknown) {
  return createOpportunitySchema.safeParse(input);
}

export function safeParseUpdateOpportunity(input: unknown) {
  return updateOpportunitySchema.safeParse(input);
}

export function safeParseUpdateOpportunityStatus(input: unknown) {
  return updateOpportunityStatusSchema.safeParse(input);
}

export function isValidOpportunityObjectId(value: string): boolean {
  return objectIdPattern.test(value);
}

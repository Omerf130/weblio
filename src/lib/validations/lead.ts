import { z } from "zod";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function optionalTrimmedString(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));
}

function requiredTrimmedString(min: number, max: number) {
  return z.string().trim().min(min).max(max);
}

const phoneSchema = z
  .string()
  .trim()
  .min(1, "נא להזין מספר טלפון")
  .max(30)
  .refine((value) => /^[\d\s\-+()]+$/.test(value), "מספר טלפון לא תקין")
  .refine((value) => value.replace(/\D/g, "").length >= 9, "מספר טלפון לא תקין");

const emailSchema = z
  .string()
  .trim()
  .min(1, "נא להזין כתובת מייל")
  .max(254)
  .transform((value) => value.toLowerCase())
  .refine((value) => EMAIL_PATTERN.test(value), "כתובת מייל לא תקינה");

const utmFieldSchema = optionalTrimmedString(200);

export const websiteLeadInputSchema = z.object({
  name: requiredTrimmedString(1, 120),
  phone: phoneSchema,
  email: emailSchema,
  utm_source: utmFieldSchema,
  utm_medium: utmFieldSchema,
  utm_campaign: utmFieldSchema,
  utm_content: utmFieldSchema,
});

export type WebsiteLeadInput = z.infer<typeof websiteLeadInputSchema>;

export const landingPageLeadInputSchema = websiteLeadInputSchema.extend({
  message: optionalTrimmedString(1000),
});

export type LandingPageLeadInput = z.infer<typeof landingPageLeadInputSchema>;

const TRUSTED_WEBSITE_FIELDS = new Set([
  "name",
  "phone",
  "email",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
]);

const TRUSTED_LANDING_FIELDS = new Set([
  ...TRUSTED_WEBSITE_FIELDS,
  "message",
]);

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "inProgress",
  "closed",
  "archived",
] as const;

export const leadStatusSchema = z.enum(LEAD_STATUSES);

export type LeadStatusInput = z.infer<typeof leadStatusSchema>;

export const leadNotesSchema = z
  .string()
  .trim()
  .max(5000, "ההערות ארוכות מדי");

export const qualificationAnswerSchema = z.object({
  key: z.string().trim().min(1).max(120),
  question: z.string().trim().min(1).max(500),
  answer: z.string().trim().min(1).max(2000),
});

export const qualificationAnswersSchema = z.array(qualificationAnswerSchema);

export type QualificationQuestionConfig = {
  id: string;
  type: "text";
  question: string;
  required: boolean;
};

export function buildLeadQualificationInputSchema(
  questions: QualificationQuestionConfig[]
) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const question of questions) {
    const field = optionalTrimmedString(2000);
    shape[question.id] = question.required
      ? z.string().trim().min(1, "שדה חובה").max(2000)
      : field;
  }

  return z.object(shape);
}

export function leadQualificationInputFromFormData(
  formData: FormData,
  questions: QualificationQuestionConfig[]
): Record<string, string> {
  const raw: Record<string, string> = {};
  for (const question of questions) {
    const value = formData.get(question.id);
    if (typeof value === "string") {
      raw[question.id] = value;
    }
  }
  return raw;
}

export function websiteLeadInputFromFormData(formData: FormData): WebsiteLeadInput {
  const raw: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (!TRUSTED_WEBSITE_FIELDS.has(key)) {
      continue;
    }

    if (typeof value === "string") {
      raw[key] = value;
    }
  }

  return {
    name: raw.name ?? "",
    phone: raw.phone ?? "",
    email: raw.email ?? "",
    utm_source: raw.utm_source,
    utm_medium: raw.utm_medium,
    utm_campaign: raw.utm_campaign,
    utm_content: raw.utm_content,
  };
}

export function landingPageLeadInputFromFormData(formData: FormData): LandingPageLeadInput {
  const raw: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (!TRUSTED_LANDING_FIELDS.has(key)) {
      continue;
    }
    if (typeof value === "string") {
      raw[key] = value;
    }
  }

  return {
    name: raw.name ?? "",
    phone: raw.phone ?? "",
    email: raw.email ?? "",
    message: raw.message,
    utm_source: raw.utm_source,
    utm_medium: raw.utm_medium,
    utm_campaign: raw.utm_campaign,
    utm_content: raw.utm_content,
  };
}

export function safeParseWebsiteLeadInput(input: WebsiteLeadInput) {
  return websiteLeadInputSchema.safeParse(input);
}

export function safeParseLandingPageLeadInput(input: LandingPageLeadInput) {
  return landingPageLeadInputSchema.safeParse(input);
}

export function safeParseLeadStatus(value: unknown) {
  return leadStatusSchema.safeParse(value);
}

export function safeParseLeadNotes(value: unknown) {
  return leadNotesSchema.safeParse(typeof value === "string" ? value : "");
}

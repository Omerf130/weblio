import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .min(1, "נא להזין מספר טלפון")
  .max(30)
  .refine((value) => /^[\d\s\-+()]+$/.test(value), "מספר טלפון לא תקין")
  .refine((value) => value.replace(/\D/g, "").length >= 9, "מספר טלפון לא תקין");

export const websiteCheckLeadInputSchema = z.object({
  name: z.string().trim().min(1, "נא להזין שם").max(120),
  phone: phoneSchema,
  analysisRunId: z.string().trim().min(1).max(64),
  websiteUrl: z.string().trim().url().max(2048),
  company: z
    .string()
    .optional()
    .refine((value) => !value || value.trim().length === 0, "invalid"),
});

export type WebsiteCheckLeadInput = z.infer<typeof websiteCheckLeadInputSchema>;

export function safeParseWebsiteCheckLeadInput(body: unknown) {
  return websiteCheckLeadInputSchema.safeParse(body);
}

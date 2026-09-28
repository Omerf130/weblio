import { z } from "zod";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const objectIdPattern = /^[a-f\d]{24}$/i;

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

export const convertOpportunityToLeadSchema = z
  .object({
    opportunityId: z
      .string()
      .trim()
      .regex(objectIdPattern, "מזהה הזדמנות לא תקין"),
    name: z.string().trim().min(1, "נא להזין שם").max(120, "השם ארוך מדי"),
    phone: optionalPhoneSchema,
    email: optionalEmailSchema,
  })
  .superRefine((data, ctx) => {
    if (!data.phone && !data.email) {
      ctx.addIssue({
        code: "custom",
        message: "נדרש טלפון או מייל (לפחות אחד).",
        path: ["phone"],
      });
    }
  });

export type ConvertOpportunityToLeadInput = z.infer<
  typeof convertOpportunityToLeadSchema
>;

export function safeParseConvertOpportunityToLead(input: unknown) {
  return convertOpportunityToLeadSchema.safeParse(input);
}

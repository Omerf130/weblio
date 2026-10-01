import { z } from "zod";

const plainText = (max: number, fieldLabel: string) =>
  z
    .string()
    .trim()
    .max(max, `${fieldLabel} ארוך מדי (עד ${max} תווים).`);

const optionalPlainText = (max: number, fieldLabel: string) =>
  z
    .string()
    .trim()
    .max(max, `${fieldLabel} ארוך מדי (עד ${max} תווים).`)
    .optional()
    .transform((value) => (value === "" ? undefined : value));

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "מזהה פרויקט אינו תקין.");

const technologyItemSchema = z
  .string()
  .trim()
  .min(1, "תגית טכנולוגיה לא יכולה להיות ריקה.")
  .max(40, "תגית טכנולוגיה ארוכה מדי (עד 40 תווים).");

export const technologiesApplySchema = z
  .array(technologyItemSchema)
  .max(20, "ניתן לשמור עד 20 טכנולוגיות.");

export const websiteProjectContentApplyFieldsSchema = z
  .object({
    title: plainText(120, "כותרת").min(1, "כותרת נדרשת."),
    subtitle: plainText(200, "תת-כותרת").optional().default(""),
    description: optionalPlainText(300, "תיאור קצר"),
    homeTitle: optionalPlainText(120, "כותרת לדף הבית"),
    homeSubtitle: optionalPlainText(200, "תת-כותרת לדף הבית"),
    technologies: technologiesApplySchema.default([]),
  })
  .strict();

export type WebsiteProjectContentApplyFields = z.infer<
  typeof websiteProjectContentApplyFieldsSchema
>;

export const applyWebsiteContentInputSchema = z.object({
  projectId: objectIdSchema,
  fields: websiteProjectContentApplyFieldsSchema,
});

export type ApplyWebsiteContentInput = z.infer<
  typeof applyWebsiteContentInputSchema
>;

export function safeParseApplyWebsiteContentInput(value: unknown) {
  return applyWebsiteContentInputSchema.safeParse(value);
}

export function formatApplyWebsiteContentValidationError(
  error: z.ZodError
): string {
  const first = error.issues[0];
  if (first?.message) {
    return first.message;
  }
  return "נתוני התוכן אינם תקינים.";
}

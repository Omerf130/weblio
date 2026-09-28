import { z } from "zod";

const objectIdPattern = /^[a-f\d]{24}$/i;
const objectIdSchema = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? undefined : v))
  .pipe(
    z.string().regex(objectIdPattern, "מזהה לא תקין").optional()
  );

export const FOLLOW_UP_STATUSES = [
  "pending",
  "completed",
  "cancelled",
] as const;

export const followUpStatusSchema = z.enum(FOLLOW_UP_STATUSES);

export const createFollowUpSchema = z
  .object({
    title: z.string().trim().min(1, "נא להזין כותרת").max(200, "הכותרת ארוכה מדי"),
    note: z
      .string()
      .trim()
      .max(2000, "ההערה ארוכה מדי")
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    dueAt: z.coerce.date({ error: "תאריך לא תקין" }),
    leadId: objectIdSchema.optional(),
    opportunityId: objectIdSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.leadId && data.opportunityId) {
      ctx.addIssue({
        code: "custom",
        message: "מעקב יכול להיות מקושר לליד או להזדמנות, לא לשניהם יחד.",
        path: ["leadId"],
      });
    }
  });

export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;

export const editFollowUpSchema = z.object({
  title: z.string().trim().min(1, "נא להזין כותרת").max(200, "הכותרת ארוכה מדי"),
  note: z
    .string()
    .trim()
    .max(2000, "ההערה ארוכה מדי")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  dueAt: z.coerce.date({ error: "תאריך לא תקין" }),
});

export type EditFollowUpInput = z.infer<typeof editFollowUpSchema>;

export function safeParseCreateFollowUp(input: unknown) {
  return createFollowUpSchema.safeParse(input);
}

export function safeParseEditFollowUp(input: unknown) {
  return editFollowUpSchema.safeParse(input);
}

export function safeParseFollowUpStatus(value: unknown) {
  return followUpStatusSchema.safeParse(value);
}

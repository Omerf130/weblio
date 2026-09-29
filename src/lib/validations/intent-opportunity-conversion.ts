import { z } from "zod";

const objectIdPattern = /^[a-f\d]{24}$/i;

export const convertIntentToOpportunitySchema = z.object({
  intentId: z.string().regex(objectIdPattern, "מזהה Intent לא תקין"),
});

export type ConvertIntentToOpportunityInput = z.infer<
  typeof convertIntentToOpportunitySchema
>;

export function safeParseConvertIntentToOpportunity(value: unknown) {
  return convertIntentToOpportunitySchema.safeParse(value);
}

import { z } from "zod";
import type { IntentClassifierResult } from "@/lib/discovery/classifier/types";

const classifierOutputSchema = z.object({
  classification: z.enum(["explicitNeed", "possibleNeed", "irrelevant"]),
  reason: z.string().trim().min(1).max(500),
  classifierVersion: z.string().trim().min(1).max(64),
});

export type ParsedClassifierResult = z.infer<typeof classifierOutputSchema>;

export function safeParseIntentClassifierResult(
  value: IntentClassifierResult | null
):
  | { ok: true; data: ParsedClassifierResult }
  | { ok: false; reason: "null" | "invalid" } {
  if (value === null) {
    return { ok: false, reason: "null" };
  }

  const parsed = classifierOutputSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, reason: "invalid" };
  }

  return { ok: true, data: parsed.data };
}

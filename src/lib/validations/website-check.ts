import { z } from "zod";
import { PUBLIC_WEBSITE_URL_MAX_LENGTH } from "@/lib/website-check/validate-public-url";

export const websiteCheckCreateRunSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "יש להזין כתובת אתר.")
    .max(PUBLIC_WEBSITE_URL_MAX_LENGTH),
});

export type WebsiteCheckCreateRunInput = z.infer<typeof websiteCheckCreateRunSchema>;

export function safeParseWebsiteCheckCreateRunInput(value: unknown) {
  return websiteCheckCreateRunSchema.safeParse(value);
}

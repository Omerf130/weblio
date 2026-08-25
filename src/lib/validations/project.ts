import { z } from "zod";

const plainText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maximum ${max} characters allowed`);

const optionalPlainText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maximum ${max} characters allowed`)
    .optional()
    .transform((value) => (value === "" ? undefined : value));

const httpsUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .url("Invalid URL")
  .refine((value) => value.startsWith("https://"), {
    message: "URL must start with https://",
  });

const imageUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) =>
      value.startsWith("/") ||
      (value.startsWith("https://") && !value.toLowerCase().startsWith("javascript:")),
    { message: "Image URL must be a relative path or https URL" }
  );

const orderSchema = z.coerce.number().int().min(0).max(9999);

function parseTechnologiesInput(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, 20);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20);
  }

  return [];
}

const technologiesSchema = z
  .preprocess(parseTechnologiesInput, z.array(plainText(40)).max(20))
  .optional()
  .default([]);

export const projectInputSchema = z.object({
  title: plainText(120).min(1, "Title is required"),
  subtitle: plainText(200).optional().default(""),
  homeTitle: optionalPlainText(120),
  homeSubtitle: optionalPlainText(200),
  imageUrl: imageUrlSchema,
  imageAlt: plainText(200).min(1, "Image alt is required"),
  projectUrl: httpsUrlSchema,
  ctaLabel: plainText(60).min(1, "CTA label is required").default("Take me"),
  isPublished: z.coerce.boolean().default(false),
  showOnHome: z.coerce.boolean().default(false),
  showOnProjectsPage: z.coerce.boolean().default(true),
  homeOrder: orderSchema.default(0),
  projectsPageOrder: orderSchema.default(0),
  technologies: technologiesSchema,
});

export type ProjectInput = z.infer<typeof projectInputSchema>;

export function parseProjectInput(input: unknown): ProjectInput {
  return projectInputSchema.parse(input);
}

export function safeParseProjectInput(input: unknown) {
  return projectInputSchema.safeParse(input);
}

export function projectInputFromFormData(formData: FormData): unknown {
  return {
    title: formData.get("title"),
    subtitle: formData.get("subtitle") ?? "",
    homeTitle: formData.get("homeTitle") ?? undefined,
    homeSubtitle: formData.get("homeSubtitle") ?? undefined,
    imageUrl: formData.get("imageUrl"),
    imageAlt: formData.get("imageAlt"),
    projectUrl: formData.get("projectUrl"),
    ctaLabel: formData.get("ctaLabel") ?? "Take me",
    isPublished: formData.get("isPublished") === "on" || formData.get("isPublished") === "true",
    showOnHome: formData.get("showOnHome") === "on" || formData.get("showOnHome") === "true",
    showOnProjectsPage: formData.get("showOnProjectsPage") === "on",
    homeOrder: formData.get("homeOrder") ?? 0,
    projectsPageOrder: formData.get("projectsPageOrder") ?? 0,
    technologies: formData.get("technologies") ?? "",
  };
}

export type PublishValidationInput = {
  title: string;
  imageUrl: string;
  imageAlt: string;
  projectUrl: string;
};

export function validatePublishFields(input: PublishValidationInput): string | null {
  if (!input.title.trim()) {
    return "כותרת נדרשת לפרסום.";
  }

  if (!input.imageUrl.trim()) {
    return "קישור לתמונה נדרש לפרסום.";
  }

  if (!input.imageAlt.trim()) {
    return "טקסט חלופי לתמונה נדרש לפרסום.";
  }

  if (!input.projectUrl.trim()) {
    return "קישור לפרויקט נדרש לפרסום.";
  }

  if (!input.projectUrl.startsWith("https://")) {
    return "קישור לפרויקט חייב להתחיל ב-https://";
  }

  return null;
}

import { z } from "zod";
import type { BuildYourDreamContent } from "@/lib/content/build-your-dream/types";

const plainText = (max: number) => z.string().trim().min(1).max(max);

const landingCtaSchema = z.object({
  label: plainText(120),
  action: z.enum(["scroll-to-form", "submit"]),
});

const landingImageSchema = z.object({
  id: plainText(80),
  src: plainText(2048),
  alt: plainText(200),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  priority: z.boolean().optional(),
});

const benefitItemSchema = z.object({
  id: plainText(80),
  icon: z.enum(["sparkles", "zap", "rocket", "heart", "star"]),
  title: plainText(120),
  text: plainText(500),
});

const processStepSchema = z.object({
  id: plainText(80),
  stepNumber: z.number().int().positive(),
  title: plainText(120),
  text: plainText(500),
});

const faqItemSchema = z.object({
  id: plainText(80),
  question: plainText(300),
  answer: plainText(1000),
});

const qualificationQuestionSchema = z.object({
  id: plainText(80),
  type: z.literal("text"),
  question: plainText(300),
  placeholder: plainText(200),
  required: z.boolean(),
});

const leadFormFieldSchema = z.object({
  label: plainText(120),
  placeholder: plainText(200),
});

export const buildYourDreamContentSchema = z.object({
  meta: z.object({
    title: plainText(120),
    description: plainText(300),
    ogImage: landingImageSchema.optional(),
  }),
  images: z.object({
    hero: landingImageSchema,
    splitPrimary: landingImageSchema,
    splitSecondary: landingImageSchema,
  }),
  hero: z.object({
    eyebrow: plainText(120),
    title: plainText(200),
    subtitle: plainText(600),
    ctaPrimary: landingCtaSchema,
    ctaSecondary: landingCtaSchema,
  }),
  benefits: z.object({
    title: plainText(120),
    subtitle: plainText(300),
    items: z.array(benefitItemSchema).min(1).max(8),
    cta: landingCtaSchema,
  }),
  splitPrimary: z.object({
    id: plainText(80),
    title: plainText(200),
    text: plainText(800),
    cta: landingCtaSchema,
  }),
  process: z.object({
    title: plainText(120),
    subtitle: plainText(300),
    steps: z.array(processStepSchema).min(1).max(8),
  }),
  ctaBanner: z.object({
    title: plainText(200),
    text: plainText(600),
    cta: landingCtaSchema,
  }),
  splitSecondary: z.object({
    id: plainText(80),
    title: plainText(200),
    text: plainText(800),
    cta: landingCtaSchema,
    reversed: z.boolean().optional(),
  }),
  faq: z.object({
    title: plainText(120),
    items: z.array(faqItemSchema).min(1).max(20),
  }),
  leadForm: z.object({
    title: plainText(120),
    subtitle: plainText(300),
    submitLabel: plainText(80),
    submittingLabel: plainText(80),
    fields: z.object({
      name: leadFormFieldSchema,
      phone: leadFormFieldSchema,
      email: leadFormFieldSchema,
      message: leadFormFieldSchema,
    }),
    errorMessage: plainText(200),
  }),
  finalCta: z.object({
    title: plainText(200),
    text: plainText(600),
    cta: landingCtaSchema,
  }),
  thankYou: z.object({
    stepLabel: plainText(80),
    title: plainText(200),
    subtitle: plainText(600),
    nextStepsTitle: plainText(120),
    nextSteps: z.array(plainText(300)).min(1).max(10),
    qualification: z.object({
      title: plainText(120),
      subtitle: plainText(300),
      submitLabel: plainText(80),
      submittingLabel: plainText(80),
      questions: z.array(qualificationQuestionSchema).min(1).max(10),
    }),
    completedTitle: plainText(200),
    completedText: plainText(600),
    errorMessage: plainText(200),
  }),
});

export type BuildYourDreamContentInput = z.infer<typeof buildYourDreamContentSchema>;

export function safeParseBuildYourDreamContent(input: unknown) {
  return buildYourDreamContentSchema.safeParse(input);
}

export function parseBuildYourDreamContentFromFormData(
  formData: FormData
): unknown {
  const raw = formData.get("contentJson");
  if (typeof raw !== "string" || !raw.trim()) {
    return null;
  }

  try {
    return JSON.parse(raw) as BuildYourDreamContent;
  } catch {
    return null;
  }
}

export function normalizeProcessStepNumbers(
  content: BuildYourDreamContent
): BuildYourDreamContent {
  return {
    ...content,
    process: {
      ...content.process,
      steps: content.process.steps.map((step, index) => ({
        ...step,
        stepNumber: index + 1,
      })),
    },
  };
}

export function enforceLandingCtaActions(
  content: BuildYourDreamContent
): BuildYourDreamContent {
  const scrollCta = { action: "scroll-to-form" as const };

  return {
    ...content,
    hero: {
      ...content.hero,
      ctaPrimary: { ...content.hero.ctaPrimary, ...scrollCta },
      ctaSecondary: { ...content.hero.ctaSecondary, ...scrollCta },
    },
    benefits: {
      ...content.benefits,
      cta: { ...content.benefits.cta, ...scrollCta },
    },
    splitPrimary: {
      ...content.splitPrimary,
      id: "split-primary",
      cta: { ...content.splitPrimary.cta, ...scrollCta },
    },
    splitSecondary: {
      ...content.splitSecondary,
      id: "split-secondary",
      reversed: true,
      cta: { ...content.splitSecondary.cta, ...scrollCta },
    },
    ctaBanner: {
      ...content.ctaBanner,
      cta: { ...content.ctaBanner.cta, ...scrollCta },
    },
    finalCta: {
      ...content.finalCta,
      cta: { ...content.finalCta.cta, ...scrollCta },
    },
  };
}

export function mergeWithPreservedFields(
  editorContent: BuildYourDreamContent,
  baseContent: BuildYourDreamContent
): BuildYourDreamContent {
  return {
    ...editorContent,
    leadForm: {
      ...editorContent.leadForm,
      errorMessage: baseContent.leadForm.errorMessage,
    },
    thankYou: {
      ...editorContent.thankYou,
      errorMessage: baseContent.thankYou.errorMessage,
    },
  };
}

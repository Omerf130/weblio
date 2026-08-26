import type { BuildYourDreamContent, LandingImageData } from "@/lib/content/build-your-dream/types";
import { STATIC_BUILD_YOUR_DREAM_CONTENT } from "@/lib/content/build-your-dream/static-content";
import { connectDB } from "@/lib/db/mongoose";
import {
  BUILD_YOUR_DREAM_LANDING_KEY,
  BuildYourDreamLanding,
  type BuildYourDreamLandingDocument,
} from "@/models/BuildYourDreamLanding";

type DbImage = {
  id: string;
  url: string;
  storageKey?: string | null;
  alt: string;
  width: number;
  height: number;
  priority?: boolean | null;
};

function mapImageToFrontend(image: DbImage): LandingImageData {
  return {
    id: image.id,
    src: image.url,
    alt: image.alt,
    width: image.width,
    height: image.height,
    ...(image.storageKey ? { storageKey: image.storageKey } : {}),
    ...(image.priority ? { priority: true } : {}),
  };
}

function mapImageToDb(image: LandingImageData): DbImage {
  return {
    id: image.id,
    url: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    ...(image.storageKey ? { storageKey: image.storageKey } : {}),
    ...(image.priority ? { priority: true } : {}),
  };
}

function asPersistedDocument(
  doc: BuildYourDreamLandingDocument
): BuildYourDreamLandingDocument & {
  meta: NonNullable<BuildYourDreamLandingDocument["meta"]>;
  images: NonNullable<BuildYourDreamLandingDocument["images"]>;
  hero: NonNullable<BuildYourDreamLandingDocument["hero"]>;
  benefits: NonNullable<BuildYourDreamLandingDocument["benefits"]>;
  splitPrimary: NonNullable<BuildYourDreamLandingDocument["splitPrimary"]>;
  process: NonNullable<BuildYourDreamLandingDocument["process"]>;
  ctaBanner: NonNullable<BuildYourDreamLandingDocument["ctaBanner"]>;
  splitSecondary: NonNullable<BuildYourDreamLandingDocument["splitSecondary"]>;
  faq: NonNullable<BuildYourDreamLandingDocument["faq"]>;
  leadForm: NonNullable<BuildYourDreamLandingDocument["leadForm"]>;
  finalCta: NonNullable<BuildYourDreamLandingDocument["finalCta"]>;
  thankYou: NonNullable<BuildYourDreamLandingDocument["thankYou"]>;
} {
  if (
    !doc.meta ||
    !doc.images ||
    !doc.hero ||
    !doc.benefits ||
    !doc.splitPrimary ||
    !doc.process ||
    !doc.ctaBanner ||
    !doc.splitSecondary ||
    !doc.faq ||
    !doc.leadForm ||
    !doc.finalCta ||
    !doc.thankYou
  ) {
    throw new Error("Invalid BuildYourDreamLanding document");
  }

  return doc as BuildYourDreamLandingDocument & {
    meta: NonNullable<BuildYourDreamLandingDocument["meta"]>;
    images: NonNullable<BuildYourDreamLandingDocument["images"]>;
    hero: NonNullable<BuildYourDreamLandingDocument["hero"]>;
    benefits: NonNullable<BuildYourDreamLandingDocument["benefits"]>;
    splitPrimary: NonNullable<BuildYourDreamLandingDocument["splitPrimary"]>;
    process: NonNullable<BuildYourDreamLandingDocument["process"]>;
    ctaBanner: NonNullable<BuildYourDreamLandingDocument["ctaBanner"]>;
    splitSecondary: NonNullable<BuildYourDreamLandingDocument["splitSecondary"]>;
    faq: NonNullable<BuildYourDreamLandingDocument["faq"]>;
    leadForm: NonNullable<BuildYourDreamLandingDocument["leadForm"]>;
    finalCta: NonNullable<BuildYourDreamLandingDocument["finalCta"]>;
    thankYou: NonNullable<BuildYourDreamLandingDocument["thankYou"]>;
  };
}

export function mapDocumentToContent(
  doc: BuildYourDreamLandingDocument
): BuildYourDreamContent {
  const persisted = asPersistedDocument(doc);

  return {
    meta: {
      title: persisted.meta.title,
      description: persisted.meta.description,
      ...(persisted.meta.ogImage
        ? { ogImage: mapImageToFrontend(persisted.meta.ogImage as DbImage) }
        : {}),
    },
    images: {
      hero: mapImageToFrontend(persisted.images.hero as DbImage),
      splitPrimary: mapImageToFrontend(persisted.images.splitPrimary as DbImage),
      splitSecondary: mapImageToFrontend(persisted.images.splitSecondary as DbImage),
    },
    hero: {
      eyebrow: persisted.hero.eyebrow,
      title: persisted.hero.title,
      subtitle: persisted.hero.subtitle,
      ctaPrimary: {
        label: persisted.hero.ctaPrimary.label,
        action: persisted.hero.ctaPrimary.action,
      },
      ctaSecondary: {
        label: persisted.hero.ctaSecondary.label,
        action: persisted.hero.ctaSecondary.action,
      },
    },
    benefits: {
      title: persisted.benefits.title,
      subtitle: persisted.benefits.subtitle,
      items: persisted.benefits.items.map((item) => ({
        id: item.id,
        icon: item.icon,
        title: item.title,
        text: item.text,
      })),
      cta: {
        label: persisted.benefits.cta.label,
        action: persisted.benefits.cta.action,
      },
    },
    splitPrimary: {
      id: persisted.splitPrimary.id,
      title: persisted.splitPrimary.title,
      text: persisted.splitPrimary.text,
      cta: {
        label: persisted.splitPrimary.cta.label,
        action: persisted.splitPrimary.cta.action,
      },
    },
    process: {
      title: persisted.process.title,
      subtitle: persisted.process.subtitle,
      steps: persisted.process.steps.map((step) => ({
        id: step.id,
        stepNumber: step.stepNumber,
        title: step.title,
        text: step.text,
      })),
    },
    ctaBanner: {
      title: persisted.ctaBanner.title,
      text: persisted.ctaBanner.text,
      cta: {
        label: persisted.ctaBanner.cta.label,
        action: persisted.ctaBanner.cta.action,
      },
    },
    splitSecondary: {
      id: persisted.splitSecondary.id,
      title: persisted.splitSecondary.title,
      text: persisted.splitSecondary.text,
      cta: {
        label: persisted.splitSecondary.cta.label,
        action: persisted.splitSecondary.cta.action,
      },
      ...(persisted.splitSecondary.reversed ? { reversed: true } : {}),
    },
    faq: {
      title: persisted.faq.title,
      items: persisted.faq.items.map((item) => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
      })),
    },
    leadForm: (() => {
      const fields = persisted.leadForm.fields!;
      return {
        title: persisted.leadForm.title,
        subtitle: persisted.leadForm.subtitle,
        submitLabel: persisted.leadForm.submitLabel,
        submittingLabel: persisted.leadForm.submittingLabel,
        fields: {
          name: {
            label: fields.name.label,
            placeholder: fields.name.placeholder,
          },
          phone: {
            label: fields.phone.label,
            placeholder: fields.phone.placeholder,
          },
          email: {
            label: fields.email.label,
            placeholder: fields.email.placeholder,
          },
          message: {
            label: fields.message.label,
            placeholder: fields.message.placeholder,
          },
        },
        errorMessage: persisted.leadForm.errorMessage,
      };
    })(),
    finalCta: {
      title: persisted.finalCta.title,
      text: persisted.finalCta.text,
      cta: {
        label: persisted.finalCta.cta.label,
        action: persisted.finalCta.cta.action,
      },
    },
    thankYou: (() => {
      const qualification = persisted.thankYou.qualification!;
      return {
        stepLabel: persisted.thankYou.stepLabel,
        title: persisted.thankYou.title,
        subtitle: persisted.thankYou.subtitle,
        nextStepsTitle: persisted.thankYou.nextStepsTitle,
        nextSteps: [...persisted.thankYou.nextSteps],
        qualification: {
          title: qualification.title,
          subtitle: qualification.subtitle,
          submitLabel: qualification.submitLabel,
          submittingLabel: qualification.submittingLabel,
          questions: qualification.questions.map((q) => ({
            id: q.id,
            type: q.type,
            question: q.question,
            placeholder: q.placeholder,
            required: q.required,
          })),
        },
        completedTitle: persisted.thankYou.completedTitle,
        completedText: persisted.thankYou.completedText,
        errorMessage: persisted.thankYou.errorMessage,
      };
    })(),
  };
}

export function mapContentToDocumentPayload(content: BuildYourDreamContent) {
  return {
    singletonKey: BUILD_YOUR_DREAM_LANDING_KEY,
    meta: {
      title: content.meta.title,
      description: content.meta.description,
      ...(content.meta.ogImage
        ? { ogImage: mapImageToDb(content.meta.ogImage) }
        : {}),
    },
    images: {
      hero: mapImageToDb(content.images.hero),
      splitPrimary: mapImageToDb(content.images.splitPrimary),
      splitSecondary: mapImageToDb(content.images.splitSecondary),
    },
    hero: content.hero,
    benefits: content.benefits,
    splitPrimary: content.splitPrimary,
    process: content.process,
    ctaBanner: content.ctaBanner,
    splitSecondary: {
      ...content.splitSecondary,
      reversed: true,
    },
    faq: content.faq,
    leadForm: content.leadForm,
    finalCta: content.finalCta,
    thankYou: content.thankYou,
  };
}

export async function getBuildYourDreamLandingDocument(): Promise<BuildYourDreamContent | null> {
  await connectDB();
  const doc = await BuildYourDreamLanding.findOne({
    singletonKey: BUILD_YOUR_DREAM_LANDING_KEY,
  }).lean<BuildYourDreamLandingDocument>();

  if (!doc) {
    return null;
  }

  return mapDocumentToContent(doc);
}

export type BuildYourDreamLandingAdminState = {
  content: BuildYourDreamContent;
  lastSavedAt: string | null;
  isPersisted: boolean;
};

export async function getBuildYourDreamLandingAdminState(): Promise<BuildYourDreamLandingAdminState> {
  try {
    await connectDB();
    const doc = await BuildYourDreamLanding.findOne({
      singletonKey: BUILD_YOUR_DREAM_LANDING_KEY,
    }).lean<BuildYourDreamLandingDocument>();

    if (doc) {
      return {
        content: mapDocumentToContent(doc),
        lastSavedAt: doc.updatedAt.toISOString(),
        isPersisted: true,
      };
    }
  } catch {
    // Fall back to static content when Mongo is unavailable.
  }

  return {
    content: STATIC_BUILD_YOUR_DREAM_CONTENT,
    lastSavedAt: null,
    isPersisted: false,
  };
}

export async function upsertBuildYourDreamLanding(
  content: BuildYourDreamContent
): Promise<Date> {
  await connectDB();
  const payload = mapContentToDocumentPayload(content);

  const doc = await BuildYourDreamLanding.findOneAndUpdate(
    { singletonKey: BUILD_YOUR_DREAM_LANDING_KEY },
    { $set: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean<BuildYourDreamLandingDocument>();

  return doc?.updatedAt ?? new Date();
}

export function getStaticPlaceholderImages() {
  return STATIC_BUILD_YOUR_DREAM_CONTENT.images;
}

export function getStaticPlaceholderOgImage() {
  return STATIC_BUILD_YOUR_DREAM_CONTENT.meta.ogImage;
}

export async function getExistingLandingStorageKeys(): Promise<string[]> {
  await connectDB();
  const doc = await BuildYourDreamLanding.findOne({
    singletonKey: BUILD_YOUR_DREAM_LANDING_KEY,
  }).lean<BuildYourDreamLandingDocument>();

  if (!doc) {
    return [];
  }

  const persisted = asPersistedDocument(doc);
  const keys: string[] = [];
  const images = [
    persisted.images.hero,
    persisted.images.splitPrimary,
    persisted.images.splitSecondary,
    persisted.meta.ogImage,
  ];

  for (const image of images) {
    if (image?.storageKey) {
      keys.push(image.storageKey);
    }
  }

  return keys;
}

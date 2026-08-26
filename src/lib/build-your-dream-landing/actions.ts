"use server";

import { revalidatePath } from "next/cache";
import type { BuildYourDreamContent, LandingImageData } from "@/lib/content/build-your-dream/types";
import { STATIC_BUILD_YOUR_DREAM_CONTENT } from "@/lib/content/build-your-dream/static-content";
import {
  getBuildYourDreamLandingDocument,
  upsertBuildYourDreamLanding,
} from "@/lib/data/build-your-dream-landing";
import { connectDB } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/auth/require-admin";
import { BlobStorageError } from "@/lib/storage/blob-config";
import {
  deleteLandingImage,
  getLandingImageFileFromFormData,
  isManagedLandingImage,
  uploadLandingImage,
} from "@/lib/storage/landing-images";
import {
  enforceLandingCtaActions,
  mergeWithPreservedFields,
  normalizeProcessStepNumbers,
  parseBuildYourDreamContentFromFormData,
  safeParseBuildYourDreamContent,
} from "@/lib/validations/build-your-dream-landing";
import {
  resolveLandingImageUpdate,
  type ImageSlot,
} from "@/lib/build-your-dream-landing/resolve-landing-image-update";

export type BuildYourDreamLandingActionState = {
  error?: string;
  success?: boolean;
  savedAt?: string;
  content?: BuildYourDreamContent;
};

const IMAGE_FILE_FIELDS: Record<ImageSlot, string> = {
  hero: "heroImageFile",
  splitPrimary: "splitPrimaryImageFile",
  splitSecondary: "splitSecondaryImageFile",
  ogImage: "ogImageFile",
};

const REMOVE_IMAGE_FIELDS: Record<ImageSlot, string> = {
  hero: "removeHeroImage",
  splitPrimary: "removeSplitPrimaryImage",
  splitSecondary: "removeSplitSecondaryImage",
  ogImage: "removeOgImage",
};

const DEFAULT_OG_IMAGE: LandingImageData = {
  id: "og-image",
  src: "",
  alt: "Open Graph",
  width: 1200,
  height: 630,
};

function isTruthyFormFlag(value: FormDataEntryValue | null): boolean {
  return value === "true" || value === "1" || value === "on";
}

function actionErrorFromUnknown(error: unknown): string {
  if (error instanceof BlobStorageError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "שמירת דף הנחיתה נכשלה. נסו שוב.";
}

async function resolveImageUpdateFromForm(
  slot: ImageSlot,
  existingImage: LandingImageData,
  formData: FormData,
  uploadedKeys: string[]
) {
  const remove = isTruthyFormFlag(formData.get(REMOVE_IMAGE_FIELDS[slot]));
  const file = getLandingImageFileFromFormData(formData, IMAGE_FILE_FIELDS[slot]);

  if (file) {
    const uploaded = await uploadLandingImage(file);
    uploadedKeys.push(uploaded.storageKey!);

    return resolveLandingImageUpdate(slot, existingImage, {
      hasNewFile: true,
      removeRequested: false,
      uploaded: {
        url: uploaded.url,
        storageKey: uploaded.storageKey,
      },
    });
  }

  return resolveLandingImageUpdate(slot, existingImage, {
    hasNewFile: false,
    removeRequested: remove,
  });
}

export async function saveBuildYourDreamLandingAction(
  _prevState: BuildYourDreamLandingActionState,
  formData: FormData
): Promise<BuildYourDreamLandingActionState> {
  await requireAdmin();

  const rawContent = parseBuildYourDreamContentFromFormData(formData);

  if (!rawContent) {
    return { error: "נתוני התוכן אינם תקינים." };
  }

  const parsed = safeParseBuildYourDreamContent(rawContent);

  if (!parsed.success) {
    return { error: "יש לתקן את השדות המסומנים." };
  }

  const uploadedKeys: string[] = [];
  const keysToDelete: string[] = [];

  try {
    await connectDB();

    const existingDoc = await getBuildYourDreamLandingDocument();
    const baseContent = existingDoc ?? STATIC_BUILD_YOUR_DREAM_CONTENT;

    let content = mergeWithPreservedFields(parsed.data, baseContent);
    content = enforceLandingCtaActions(normalizeProcessStepNumbers(content));

    const heroResult = await resolveImageUpdateFromForm(
      "hero",
      baseContent.images.hero,
      formData,
      uploadedKeys
    );
    const splitPrimaryResult = await resolveImageUpdateFromForm(
      "splitPrimary",
      baseContent.images.splitPrimary,
      formData,
      uploadedKeys
    );
    const splitSecondaryResult = await resolveImageUpdateFromForm(
      "splitSecondary",
      baseContent.images.splitSecondary,
      formData,
      uploadedKeys
    );
    const ogResult = await resolveImageUpdateFromForm(
      "ogImage",
      baseContent.meta.ogImage ?? DEFAULT_OG_IMAGE,
      formData,
      uploadedKeys
    );

    for (const key of [
      heroResult.deleteStorageKey,
      splitPrimaryResult.deleteStorageKey,
      splitSecondaryResult.deleteStorageKey,
      ogResult.deleteStorageKey,
    ]) {
      if (key && isManagedLandingImage(key)) {
        keysToDelete.push(key);
      }
    }

    content = {
      ...content,
      images: {
        hero: heroResult.image ?? baseContent.images.hero,
        splitPrimary: splitPrimaryResult.image ?? baseContent.images.splitPrimary,
        splitSecondary: splitSecondaryResult.image ?? baseContent.images.splitSecondary,
      },
      meta: {
        ...content.meta,
        ...(ogResult.image?.src ? { ogImage: ogResult.image } : {}),
      },
    };

    if (!ogResult.image?.src) {
      const { ogImage: _ogImage, ...metaRest } = content.meta;
      void _ogImage;
      content = { ...content, meta: metaRest };
    }

    const savedAt = await upsertBuildYourDreamLanding(content);

    await Promise.all(keysToDelete.map((key) => deleteLandingImage(key)));

    revalidatePath("/build-your-dream");
    revalidatePath("/build-your-dream/thank-you");
    revalidatePath("/admin/landing-page");

    return {
      success: true,
      savedAt: savedAt.toISOString(),
      content,
    };
  } catch (error) {
    await Promise.all(
      uploadedKeys.filter(isManagedLandingImage).map((key) => deleteLandingImage(key))
    );

    return { error: actionErrorFromUnknown(error) };
  }
}

import type { LandingImageData } from "@/lib/content/build-your-dream/types";
import { STATIC_BUILD_YOUR_DREAM_CONTENT } from "@/lib/content/build-your-dream/static-content";

export type ImageSlot = "hero" | "splitPrimary" | "splitSecondary" | "ogImage";

export type LandingImageUpdateInput = {
  hasNewFile: boolean;
  removeRequested: boolean;
  uploaded?: {
    url: string;
    storageKey?: string;
  };
};

export type LandingImageUpdateResult = {
  image?: LandingImageData;
  deleteStorageKey?: string;
};

function getPlaceholderForSlot(slot: ImageSlot): LandingImageData | undefined {
  const placeholders = STATIC_BUILD_YOUR_DREAM_CONTENT.images;

  switch (slot) {
    case "hero":
      return placeholders.hero;
    case "splitPrimary":
      return placeholders.splitPrimary;
    case "splitSecondary":
      return placeholders.splitSecondary;
    case "ogImage":
      return undefined;
  }
}

export function resolveLandingImageUpdate(
  slot: ImageSlot,
  existingImage: LandingImageData,
  input: LandingImageUpdateInput
): LandingImageUpdateResult {
  if (input.hasNewFile && input.uploaded) {
    return {
      image: {
        ...existingImage,
        src: input.uploaded.url,
        storageKey: input.uploaded.storageKey,
      },
      deleteStorageKey: existingImage.storageKey,
    };
  }

  if (input.removeRequested) {
    const placeholder = getPlaceholderForSlot(slot);

    return {
      image: placeholder ? { ...placeholder, storageKey: undefined } : undefined,
      deleteStorageKey: existingImage.storageKey,
    };
  }

  return { image: existingImage };
}

export function isEditorContentDirty(
  contentSnapshot: string,
  savedSnapshot: string
): boolean {
  return contentSnapshot !== savedSnapshot;
}

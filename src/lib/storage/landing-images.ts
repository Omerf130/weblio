import { randomUUID } from "node:crypto";
import { deleteBlobByStorageKey, uploadPublicBlob } from "@/lib/storage/blob";
import {
  extensionForImageMime,
  IMAGE_REQUIRED_ERROR,
  type ImageFileLike,
  validateImageFile,
} from "@/lib/storage/image-validation";

export type LandingImageRef = {
  url: string;
  storageKey?: string;
};

export type FormDataImageBlob = ImageFileLike & Pick<Blob, "arrayBuffer">;

export function isFormDataImageBlob(value: unknown): value is FormDataImageBlob {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<ImageFileLike>;

  return (
    typeof candidate.size === "number" &&
    candidate.size > 0 &&
    typeof candidate.type === "string"
  );
}

export function isManagedLandingImage(storageKey?: string | null): boolean {
  return typeof storageKey === "string" && storageKey.startsWith("landing/");
}

export function buildLandingImagePathname(mimeType: string): string | null {
  const extension = extensionForImageMime(mimeType);

  if (!extension) {
    return null;
  }

  return `landing/${randomUUID()}.${extension}`;
}

export function validateLandingImageFile(
  file: ImageFileLike | null | undefined
): string | null {
  if (
    !file ||
    typeof file.size !== "number" ||
    file.size <= 0 ||
    typeof file.type !== "string"
  ) {
    return IMAGE_REQUIRED_ERROR;
  }

  return validateImageFile(file);
}

export async function uploadLandingImage(file: Blob): Promise<LandingImageRef> {
  const validationError = validateLandingImageFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const pathname = buildLandingImagePathname(file.type);

  if (!pathname) {
    throw new Error("יש להעלות תמונה מסוג JPG, PNG או WEBP.");
  }

  const uploaded = await uploadPublicBlob(pathname, file);

  return {
    url: uploaded.url,
    storageKey: uploaded.storageKey,
  };
}

export async function deleteLandingImage(storageKey: string): Promise<void> {
  if (!isManagedLandingImage(storageKey)) {
    return;
  }

  await deleteBlobByStorageKey(storageKey);
}

export function getLandingImageFileFromFormData(
  formData: FormData,
  fieldName: string
): Blob | null {
  const value = formData.get(fieldName);

  if (!isFormDataImageBlob(value)) {
    return null;
  }

  return value as Blob;
}

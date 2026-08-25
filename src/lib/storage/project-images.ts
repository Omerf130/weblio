import { randomUUID } from "node:crypto";
import { deleteBlobByStorageKey, uploadPublicBlob } from "@/lib/storage/blob";
import {
  extensionForImageMime,
  IMAGE_REQUIRED_ERROR,
  type ImageFileLike,
  validateImageFile,
} from "@/lib/storage/image-validation";

export type ProjectImageRef = {
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

export function isManagedProjectImage(storageKey?: string | null): boolean {
  return typeof storageKey === "string" && storageKey.startsWith("projects/");
}

export function buildProjectImagePathname(
  scopeId: string,
  mimeType: string
): string | null {
  const extension = extensionForImageMime(mimeType);

  if (!extension) {
    return null;
  }

  return `projects/${scopeId}/${randomUUID()}.${extension}`;
}

export function validateProjectImageFile(
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

export async function uploadProjectImage(
  file: Blob,
  scopeId: string
): Promise<ProjectImageRef> {
  const validationError = validateProjectImageFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const pathname = buildProjectImagePathname(scopeId, file.type);

  if (!pathname) {
    throw new Error("יש להעלות תמונה מסוג JPG, PNG או WEBP.");
  }

  const uploaded = await uploadPublicBlob(pathname, file);

  return {
    url: uploaded.url,
    storageKey: uploaded.storageKey,
  };
}

export async function deleteProjectImage(storageKey: string): Promise<void> {
  if (!isManagedProjectImage(storageKey)) {
    return;
  }

  await deleteBlobByStorageKey(storageKey);
}

export function getImageFileFromFormData(formData: FormData): Blob | null {
  const value = formData.get("imageFile");

  if (!isFormDataImageBlob(value)) {
    return null;
  }

  return value as Blob;
}

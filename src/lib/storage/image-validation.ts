export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const IMAGE_MIME_ERROR = "יש להעלות תמונה מסוג JPG, PNG או WEBP.";
export const IMAGE_SIZE_ERROR = "גודל התמונה המקסימלי הוא 5MB.";
export const IMAGE_REQUIRED_ERROR = "יש להעלות תמונת פרויקט.";

export type ImageFileLike = {
  type: string;
  size: number;
};

export function validateImageFile(
  file: ImageFileLike | null | undefined
): string | null {
  if (!file) {
    return IMAGE_REQUIRED_ERROR;
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    return IMAGE_MIME_ERROR;
  }

  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    return IMAGE_SIZE_ERROR;
  }

  return null;
}

export function extensionForImageMime(mime: string): string | null {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}

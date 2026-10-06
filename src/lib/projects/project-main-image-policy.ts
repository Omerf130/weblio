export const HOME_MAIN_IMAGE_REQUIRED_ERROR =
  "כדי להציג פרויקט בדף הבית יש להעלות תמונת פרויקט ראשית.";

export function requiresMainProjectImage(showOnHome: boolean): boolean {
  return showOnHome;
}

export function hasUsableMainProjectImageUrl(imageUrl: string | undefined | null): boolean {
  return Boolean(imageUrl?.trim());
}

export function validateMainProjectImageRequirement(input: {
  showOnHome: boolean;
  imageUrl?: string | null;
  hasNewImageUpload?: boolean;
}): string | null {
  if (!requiresMainProjectImage(input.showOnHome)) {
    return null;
  }

  const hasImage =
    input.hasNewImageUpload || hasUsableMainProjectImageUrl(input.imageUrl);

  if (!hasImage) {
    return HOME_MAIN_IMAGE_REQUIRED_ERROR;
  }

  return null;
}

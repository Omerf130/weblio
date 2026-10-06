"use client";

import ProjectFileImageField from "./ProjectFileImageField";

type ProjectImageFieldProps = {
  currentImageUrl?: string;
  isRequired: boolean;
  disabled?: boolean;
  helperText?: string;
};

export default function ProjectImageField({
  currentImageUrl,
  isRequired,
  disabled = false,
  helperText,
}: ProjectImageFieldProps) {
  return (
    <ProjectFileImageField
      id="imageFile"
      name="imageFile"
      label="תמונת הפרויקט"
      previewAlt="תצוגה מקדימה של תמונת הפרויקט"
      currentImageUrl={currentImageUrl}
      isRequired={isRequired}
      disabled={disabled}
      helperText={helperText}
    />
  );
}

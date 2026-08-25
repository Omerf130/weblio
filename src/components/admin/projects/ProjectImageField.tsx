"use client";

import { useEffect, useRef, useState } from "react";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  IMAGE_MIME_ERROR,
  IMAGE_SIZE_ERROR,
  MAX_IMAGE_BYTES,
} from "@/lib/storage/image-validation";
import styles from "./ProjectForm.module.scss";

type ProjectImageFieldProps = {
  currentImageUrl?: string;
  isRequired: boolean;
  disabled?: boolean;
};

export default function ProjectImageField({
  currentImageUrl,
  isRequired,
  disabled = false,
}: ProjectImageFieldProps) {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  function clearPreview() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setPreviewUrl(null);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setClientError(null);
    clearPreview();

    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFileName(null);
      return;
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
      setClientError(IMAGE_MIME_ERROR);
      setSelectedFileName(null);
      event.target.value = "";
      return;
    }

    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      setClientError(IMAGE_SIZE_ERROR);
      setSelectedFileName(null);
      event.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
    setSelectedFileName(file.name);
  }

  const displayPreview = previewUrl ?? (selectedFileName ? null : currentImageUrl);

  return (
    <div className={styles.fieldFull}>
      <label className={styles.label} htmlFor="imageFile">
        תמונת הפרויקט
      </label>

      {displayPreview ? (
        <img
          src={displayPreview}
          alt="תצוגה מקדימה של תמונת הפרויקט"
          className={styles.imagePreview}
        />
      ) : null}

      <input
        id="imageFile"
        name="imageFile"
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className={styles.fileInput}
        required={isRequired}
        disabled={disabled}
        onChange={handleFileChange}
      />

      {selectedFileName ? (
        <span className={styles.hint}>קובץ נבחר: {selectedFileName}</span>
      ) : (
        <span className={styles.hint}>JPG, PNG או WEBP עד 5MB</span>
      )}

      {clientError ? (
        <p className={styles.fieldError} role="alert">
          {clientError}
        </p>
      ) : null}
    </div>
  );
}

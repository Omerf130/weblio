"use client";

import { useEffect, useRef, useState } from "react";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  IMAGE_MIME_ERROR,
  IMAGE_SIZE_ERROR,
  MAX_IMAGE_BYTES,
} from "@/lib/storage/image-validation";
import styles from "./LandingPageEditor.module.scss";

type LandingPageImageFieldProps = {
  label: string;
  currentImageUrl?: string;
  fileInputName: string;
  removeInputName: string;
  disabled?: boolean;
  resetKey?: number | string;
  onRemoveChange?: (removed: boolean) => void;
};

export default function LandingPageImageField({
  label,
  currentImageUrl,
  fileInputName,
  removeInputName,
  disabled = false,
  resetKey,
  onRemoveChange,
}: LandingPageImageFieldProps) {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function clearPreview() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreviewUrl(null);
  }

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (resetKey === undefined) {
      return;
    }

    clearPreview();
    setSelectedFileName(null);
    setRemoved(false);
    setClientError(null);
    onRemoveChange?.(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [resetKey, onRemoveChange]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setClientError(null);
    clearPreview();
    setRemoved(false);
    onRemoveChange?.(false);

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

  function handleRemove() {
    clearPreview();
    setSelectedFileName(null);
    setRemoved(true);
    onRemoveChange?.(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const displayPreview =
    previewUrl ?? (removed || selectedFileName ? null : currentImageUrl);

  return (
    <div className={styles.imageField}>
      <span className={styles.label}>{label}</span>

      {displayPreview ? (
        <img src={displayPreview} alt="" className={styles.imagePreview} />
      ) : null}

      <input
        ref={fileInputRef}
        name={fileInputName}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className={styles.fileInput}
        disabled={disabled}
        onChange={handleFileChange}
      />

      <div className={styles.imageActions}>
        {currentImageUrl ? (
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={disabled}
            onClick={handleRemove}
          >
            הסר תמונה
          </button>
        ) : null}
      </div>

      <input type="hidden" name={removeInputName} value={removed ? "true" : "false"} />

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

"use client";

import { useEffect, useRef, useState } from "react";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  IMAGE_MIME_ERROR,
  IMAGE_SIZE_ERROR,
  MAX_IMAGE_BYTES,
} from "@/lib/storage/image-validation";
import styles from "./ProjectForm.module.scss";

type ProjectFileImageFieldProps = {
  id: string;
  name: string;
  label: string;
  previewAlt: string;
  currentImageUrl?: string;
  isRequired?: boolean;
  disabled?: boolean;
  hint?: string;
  helperText?: string;
  allowRemove?: boolean;
  removeFieldName?: string;
};

export default function ProjectFileImageField({
  id,
  name,
  label,
  previewAlt,
  currentImageUrl,
  isRequired = false,
  disabled = false,
  hint = "JPG, PNG או WEBP עד 5MB",
  helperText,
  allowRemove = false,
  removeFieldName = "removeShowcase",
}: ProjectFileImageFieldProps) {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [removeChecked, setRemoveChecked] = useState(false);
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
    setRemoveChecked(false);

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

  const showExisting = !removeChecked && !previewUrl && !selectedFileName;
  const displayPreview = previewUrl ?? (showExisting ? currentImageUrl : null);

  return (
    <div className={styles.fieldFull}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>

      {helperText ? <p className={styles.hint}>{helperText}</p> : null}

      {displayPreview ? (
        <img src={displayPreview} alt={previewAlt} className={styles.imagePreview} />
      ) : null}

      <input
        id={id}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className={styles.fileInput}
        required={isRequired && !currentImageUrl && !removeChecked}
        disabled={disabled || removeChecked}
        onChange={handleFileChange}
      />

      {selectedFileName ? (
        <span className={styles.hint}>קובץ נבחר: {selectedFileName}</span>
      ) : (
        <span className={styles.hint}>{hint}</span>
      )}

      {allowRemove && currentImageUrl ? (
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            name={removeFieldName}
            value="1"
            checked={removeChecked}
            disabled={disabled || Boolean(previewUrl)}
            onChange={(event) => {
              setRemoveChecked(event.target.checked);
              if (event.target.checked) {
                clearPreview();
                setSelectedFileName(null);
              }
            }}
          />
          הסר תמונת תצוגה לעמוד הפרויקטים
        </label>
      ) : null}

      {clientError ? (
        <p className={styles.fieldError} role="alert">
          {clientError}
        </p>
      ) : null}
    </div>
  );
}

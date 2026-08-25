export const BLOB_UNAVAILABLE_ERROR = "חסר חיבור ל-Vercel Blob בסביבת הפיתוח.";

export const BLOB_OIDC_DEVELOPMENT_ERROR =
  "חיבור Vercel Blob לסביבת Development לא מוגדר. הוסף BLOB_READ_WRITE_TOKEN ל-.env.local, או אפשר Development בחיבור ה-Blob Store ב-Vercel.";

export type BlobAuthMode = "oidc" | "readWriteToken" | "none";

export class BlobStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlobStorageError";
  }
}

function isMissingEnvValue(value: string | undefined): boolean {
  const trimmed = value?.trim();
  return !trimmed || trimmed === "[SENSITIVE]";
}

export function getBlobReadWriteToken(): string | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (isMissingEnvValue(token)) {
    return null;
  }

  return token!.trim();
}

export function hasBlobOidcCredentials(): boolean {
  const oidcToken = process.env.VERCEL_OIDC_TOKEN;
  const storeId = process.env.BLOB_STORE_ID;

  return !isMissingEnvValue(oidcToken) && !isMissingEnvValue(storeId);
}

export function getBlobAuthMode(): BlobAuthMode {
  if (getBlobReadWriteToken()) {
    return "readWriteToken";
  }

  if (hasBlobOidcCredentials()) {
    return "oidc";
  }

  return "none";
}

export function hasBlobCredentials(): boolean {
  return getBlobAuthMode() !== "none";
}

export function assertBlobCredentials(): void {
  if (!hasBlobCredentials()) {
    console.error("Blob upload failed: missing credentials");
    throw new BlobStorageError(BLOB_UNAVAILABLE_ERROR);
  }
}

export function isBlobOidcEnvironmentError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes(
      "OIDC is enabled for this project, but not for the"
    ) && error.message.includes("environment.")
  );
}

export function getSafeBlobProviderErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "unknown provider error";
  }

  return error.message;
}

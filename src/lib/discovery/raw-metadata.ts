export const MAX_RAW_METADATA_BYTES = 16 * 1024;

export type RawMetadataValidationResult =
  | { ok: true; value: Record<string, unknown> | undefined }
  | { ok: false; reason: "not_object" | "too_large" | "not_serializable" };

export function getJsonSerializedByteLength(value: unknown): number | null {
  try {
    return Buffer.byteLength(JSON.stringify(value), "utf8");
  } catch {
    return null;
  }
}

export function validateRawMetadata(
  value: unknown
): RawMetadataValidationResult {
  if (value === undefined || value === null) {
    return { ok: true, value: undefined };
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, reason: "not_object" };
  }

  const byteLength = getJsonSerializedByteLength(value);
  if (byteLength === null) {
    return { ok: false, reason: "not_serializable" };
  }

  if (byteLength > MAX_RAW_METADATA_BYTES) {
    return { ok: false, reason: "too_large" };
  }

  return { ok: true, value: value as Record<string, unknown> };
}

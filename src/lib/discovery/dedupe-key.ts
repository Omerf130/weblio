import { createHash } from "node:crypto";
import { normalizeDiscoveryUrl } from "@/lib/discovery/normalize-url";

export class DedupeKeyInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DedupeKeyInputError";
  }
}

function normalizeExternalId(externalId: string): string {
  return externalId.trim();
}

export type ComputeDedupeKeyInput = {
  provider: string;
  externalId?: string;
  sourceUrl?: string;
};

/**
 * Deterministic dedupe identity:
 * 1) provider + externalId → provider:{provider}:{externalId}
 * 2) sourceUrl → url:{sha256(normalizedUrl)}
 */
export function computeDedupeKey(input: ComputeDedupeKeyInput): string {
  const provider = input.provider.trim().toLowerCase();
  if (!provider) {
    throw new DedupeKeyInputError("PROVIDER_REQUIRED");
  }

  const externalId = input.externalId?.trim();
  if (externalId) {
    const key = `provider:${provider}:${normalizeExternalId(externalId)}`;
    if (key.length > 320) {
      throw new DedupeKeyInputError("DEDUPE_KEY_TOO_LONG");
    }
    return key;
  }

  const sourceUrl = input.sourceUrl?.trim();
  if (sourceUrl) {
    const normalized = normalizeDiscoveryUrl(sourceUrl);
    if (!normalized.ok) {
      throw new DedupeKeyInputError(
        normalized.reason === "not_https" ? "SOURCE_URL_NOT_HTTPS" : "SOURCE_URL_INVALID"
      );
    }
    const hash = createHash("sha256").update(normalized.normalizedUrl).digest("hex");
    const key = `url:${hash}`;
    if (key.length > 320) {
      throw new DedupeKeyInputError("DEDUPE_KEY_TOO_LONG");
    }
    return key;
  }

  throw new DedupeKeyInputError("EXTERNAL_ID_OR_SOURCE_URL_REQUIRED");
}

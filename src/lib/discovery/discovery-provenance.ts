import type { NormalizedDiscoveryInput } from "@/lib/discovery/types";

export type DiscoveryIntentProvenance = {
  discoveryProfileId?: string;
  discoveryQuery?: string;
};

const MAX_PROFILE_ID_LENGTH = 16;
const MAX_QUERY_LENGTH = 400;

/**
 * Copies Tavily discovery attribution from normalized rawMetadata when present.
 * In-run URL dedupe uses first candidate wins — provenance reflects that winning profile.
 */
export function extractDiscoveryProvenance(
  input: Pick<NormalizedDiscoveryInput, "rawMetadata">
): DiscoveryIntentProvenance {
  const meta = input.rawMetadata;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
    return {};
  }

  const record = meta as Record<string, unknown>;
  const profileRaw = record.profileId;
  const queryRaw = record.query;

  const discoveryProfileId =
    typeof profileRaw === "string" && profileRaw.trim().length > 0
      ? profileRaw.trim().slice(0, MAX_PROFILE_ID_LENGTH)
      : undefined;

  const discoveryQuery =
    typeof queryRaw === "string" && queryRaw.trim().length > 0
      ? queryRaw.trim().slice(0, MAX_QUERY_LENGTH)
      : undefined;

  if (!discoveryProfileId && !discoveryQuery) {
    return {};
  }

  return { discoveryProfileId, discoveryQuery };
}

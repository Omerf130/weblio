/** Ingest architecture used when an Intent was first created. */
export const DISCOVERY_INGEST_PATH_CLASSIFIED_FIRST = "classified_first" as const;

export type DiscoveryIngestPath = typeof DISCOVERY_INGEST_PATH_CLASSIFIED_FIRST;

export function isClassifiedFirstDiscoveryIngestPath(
  value: unknown
): value is DiscoveryIngestPath {
  return value === DISCOVERY_INGEST_PATH_CLASSIFIED_FIRST;
}

import { createHash } from "node:crypto";

/** Stable cache key for a normalized analysis URL. */
export function hashWebsiteAnalysisUrl(normalizedUrl: string): string {
  return createHash("sha256").update(normalizedUrl, "utf8").digest("hex");
}

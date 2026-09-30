import type { BusinessVerificationPocConfig } from "@/lib/discovery/poc/business-verification/types";

export function isPrimaryTypeAcceptedForPoc(
  primaryType: string | undefined,
  config: Pick<BusinessVerificationPocConfig, "acceptedPrimaryTypes">
): boolean {
  const allowed = config.acceptedPrimaryTypes;
  if (!allowed || allowed.length === 0) {
    return true;
  }
  const normalized = primaryType?.trim();
  if (!normalized) {
    return false;
  }
  return allowed.includes(normalized);
}

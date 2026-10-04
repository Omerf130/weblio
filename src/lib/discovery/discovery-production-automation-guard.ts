import { getDiscoveryAutomationConfig } from "@/lib/discovery/discovery-automation-env";

export type ProductionAutomationGuardResult =
  | { ok: true }
  | { ok: false; reason: "automation_disabled" | "not_production" | "cron_secret_missing" };

/**
 * Future Vercel cron entry guard (7B.2B). Not applied to manual admin discovery.
 */
export function assertProductionDiscoveryAutomationAllowed(
  source: Record<string, string | undefined> = process.env
): ProductionAutomationGuardResult {
  const config = getDiscoveryAutomationConfig(source);

  if (!config.automationEnabled) {
    return { ok: false, reason: "automation_disabled" };
  }

  if (source.VERCEL_ENV !== "production") {
    return { ok: false, reason: "not_production" };
  }

  if (!config.cronSecretConfigured) {
    return { ok: false, reason: "cron_secret_missing" };
  }

  return { ok: true };
}

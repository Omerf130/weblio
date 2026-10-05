import { resolveDiscoveryCronSecret } from "@/lib/discovery/discovery-cron-auth";

export type DiscoveryAutomationConfig = {
  automationEnabled: boolean;
  cronSecretConfigured: boolean;
};

/** Server-only automation flags (defaults off; no secret values exposed). */
export function getDiscoveryAutomationConfig(
  source: Record<string, string | undefined> = process.env
): DiscoveryAutomationConfig {
  const automationEnabled = source.DISCOVERY_AUTOMATION_ENABLED === "1";
  const cronSecret = resolveDiscoveryCronSecret(source);
  return {
    automationEnabled,
    cronSecretConfigured: Boolean(cronSecret),
  };
}

export function isDiscoveryAutomationEnabled(
  source: Record<string, string | undefined> = process.env
): boolean {
  return getDiscoveryAutomationConfig(source).automationEnabled;
}

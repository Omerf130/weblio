import type { AdminSessionUser } from "@/lib/auth/session";

/** Fixed token for scheduled automation (not a secret). */
export const SCHEDULED_DISCOVERY_TRIGGERED_BY = "scheduled:vercel-cron";

export type DiscoveryTriggerKind = "manual" | "scheduled";

export type DiscoveryRunTrigger =
  | {
      kind: "manual";
      admin: Pick<AdminSessionUser, "email" | "id">;
    }
  | {
      kind: "scheduled";
      channel: "vercel_cron";
      scheduleIsraelDateKey: string;
    };

export function isDiscoveryRunTrigger(
  value: DiscoveryRunTrigger | Pick<AdminSessionUser, "email" | "id">
): value is DiscoveryRunTrigger {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    (value.kind === "manual" || value.kind === "scheduled")
  );
}

export function normalizeDiscoveryRunTrigger(
  input: DiscoveryRunTrigger | Pick<AdminSessionUser, "email" | "id">
): DiscoveryRunTrigger {
  if (isDiscoveryRunTrigger(input)) {
    return input;
  }
  return { kind: "manual", admin: input };
}

export function triggeredByFromTrigger(trigger: DiscoveryRunTrigger): string {
  if (trigger.kind === "manual") {
    return trigger.admin.email?.trim() || trigger.admin.id;
  }
  return SCHEDULED_DISCOVERY_TRIGGERED_BY;
}

export function triggerKindFromTrigger(trigger: DiscoveryRunTrigger): DiscoveryTriggerKind {
  return trigger.kind;
}

import type { AdminSessionUser } from "@/lib/auth/session";
import { getDiscoveryMonthlyCreditUsage } from "@/lib/data/discovery-monthly-credits";
import {
  completeDiscoveryRun,
  computeCooldownRemainingSeconds,
  failDiscoveryRun,
  findActiveDiscoveryRun,
  findLatestDiscoveryRunForCooldown,
  findScheduledDiscoveryRunForIsraelDate,
  isDiscoveryRunStale,
  markStaleDiscoveryRunsFailed,
  skipDiscoveryRun,
  toDiscoveryRunSummaryDto,
  tryBeginDiscoveryRun,
} from "@/lib/data/discovery-runs";
import { getIntentClassifierForIngest } from "@/lib/discovery/classifier/get-intent-classifier";
import { evaluateCreditPreflight } from "@/lib/discovery/discovery-credit-guard";
import { getDiscoveryCreditConfig } from "@/lib/discovery/discovery-credit-env";
import { isDiscoveryTavilyEnabled } from "@/lib/discovery/discovery-env";
import {
  getV2ProductionDiscoveryPolicy,
  type DiscoveryPolicy,
} from "@/lib/discovery/discovery-policy";
import { countPlannedTavilyProfileSearches } from "@/lib/discovery/discovery-planned-profiles";
import { deriveDiscoveryRunStatus } from "@/lib/discovery/discovery-run-status";
import {
  normalizeDiscoveryRunTrigger,
  triggeredByFromTrigger,
  triggerKindFromTrigger,
  type DiscoveryRunTrigger,
} from "@/lib/discovery/discovery-run-trigger";
import { runTavilyProductionDiscovery } from "@/lib/discovery/run-tavily-discovery";
import { loadSearchProfileCatalogV2Production } from "@/lib/discovery/providers/load-search-profiles";
import {
  createTavilySearchProviderFromEnv,
  type TavilyHttpAttemptCounter,
} from "@/lib/discovery/providers/tavily-search-provider";
import type { DiscoverySearchProvider } from "@/lib/discovery/providers/types";
import type {
  RunTavilyDiscoveryActionResult,
  RunTavilyDiscoveryBlockReason,
  ScheduledDiscoveryOutcome,
} from "@/types/discovery-run";

export type ExecuteTavilyDiscoveryRunDeps = {
  isEnabled?: () => boolean;
  getPolicy?: () => DiscoveryPolicy;
  loadCatalog?: typeof loadSearchProfileCatalogV2Production;
  createProvider?: (httpAttemptCounter: TavilyHttpAttemptCounter) => DiscoverySearchProvider | null;
  runDiscovery?: typeof runTavilyProductionDiscovery;
  markStaleRuns?: typeof markStaleDiscoveryRunsFailed;
  findActiveRun?: typeof findActiveDiscoveryRun;
  findLatestForCooldown?: typeof findLatestDiscoveryRunForCooldown;
  tryBeginRun?: typeof tryBeginDiscoveryRun;
  completeRun?: typeof completeDiscoveryRun;
  failRun?: typeof failDiscoveryRun;
  skipRun?: typeof skipDiscoveryRun;
  getMonthlyUsage?: typeof getDiscoveryMonthlyCreditUsage;
  getCreditConfig?: typeof getDiscoveryCreditConfig;
  now?: () => Date;
};

function blockedResult(
  reason: RunTavilyDiscoveryBlockReason,
  message: string,
  cooldownRemainingSeconds?: number
): RunTavilyDiscoveryActionResult {
  return {
    success: false,
    reason,
    message,
    ...(cooldownRemainingSeconds !== undefined ? { cooldownRemainingSeconds } : {}),
  };
}

function creditLimitMessageHebrew(): string {
  return "הגעתם למגבלת הקרדיט החודשית לחיפוש Tavily. לא ניתן להפעיל חיפוש נוסף החודש.";
}

async function runCreditPreflight(input: {
  catalog: ReturnType<typeof loadSearchProfileCatalogV2Production>;
  policy: DiscoveryPolicy;
  referenceDate: Date;
  deps: ExecuteTavilyDiscoveryRunDeps;
}) {
  const getCreditConfig = input.deps.getCreditConfig ?? getDiscoveryCreditConfig;
  const getMonthlyUsage = input.deps.getMonthlyUsage ?? getDiscoveryMonthlyCreditUsage;
  const creditConfig = getCreditConfig();
  const monthUsage = await getMonthlyUsage({
    referenceDate: input.referenceDate,
    creditConfig,
  });
  const plannedProfileCount = countPlannedTavilyProfileSearches({
    catalog: input.catalog,
    policy: input.policy,
    referenceDate: input.referenceDate,
  });
  return evaluateCreditPreflight({
    monthCreditsUsed: monthUsage.estimatedCreditsUsed,
    plannedProfileCount,
    creditConfig,
  });
}

export async function executeTavilyDiscoveryRun(
  triggerInput: DiscoveryRunTrigger | Pick<AdminSessionUser, "email" | "id">,
  deps: ExecuteTavilyDiscoveryRunDeps = {}
): Promise<RunTavilyDiscoveryActionResult> {
  const trigger = normalizeDiscoveryRunTrigger(triggerInput);
  const now = deps.now?.() ?? new Date();
  const isEnabled = deps.isEnabled ?? isDiscoveryTavilyEnabled;
  const getPolicy = deps.getPolicy ?? getV2ProductionDiscoveryPolicy;
  const loadCatalog = deps.loadCatalog ?? loadSearchProfileCatalogV2Production;
  const markStaleRuns = deps.markStaleRuns ?? markStaleDiscoveryRunsFailed;
  const findActiveRun = deps.findActiveRun ?? findActiveDiscoveryRun;
  const findLatestForCooldown = deps.findLatestForCooldown ?? findLatestDiscoveryRunForCooldown;
  const tryBeginRun = deps.tryBeginRun ?? tryBeginDiscoveryRun;
  const completeRun = deps.completeRun ?? completeDiscoveryRun;
  const failRun = deps.failRun ?? failDiscoveryRun;
  const runDiscovery = deps.runDiscovery ?? runTavilyProductionDiscovery;

  if (!isEnabled()) {
    return blockedResult(
      "disabled",
      "Discovery is disabled. Set DISCOVERY_TAVILY_ENABLED=1 on the server to enable."
    );
  }

  const policy = getPolicy();
  const catalog = loadCatalog();
  const triggeredBy = triggeredByFromTrigger(trigger);
  const triggerKind = triggerKindFromTrigger(trigger);
  const scheduleIsraelDateKey =
    trigger.kind === "scheduled" ? trigger.scheduleIsraelDateKey : undefined;

  await markStaleRuns(now);

  const activeRun = await findActiveRun();
  if (activeRun) {
    const startedAt = new Date(activeRun.startedAt);
    if (!isDiscoveryRunStale(startedAt, now)) {
      return blockedResult(
        "already_running",
        "A discovery run is already in progress. Try again later."
      );
    }
    await failRun({
      runId: activeRun.id,
      failureCategory: "stale_running",
      completedAt: now,
    });
  }

  const creditPreflight = await runCreditPreflight({
    catalog,
    policy,
    referenceDate: now,
    deps,
  });

  if (!creditPreflight.ok) {
    if (triggerKind === "scheduled" && scheduleIsraelDateKey) {
      const skipRun = deps.skipRun ?? skipDiscoveryRun;
      await skipRun({
        triggeredBy,
        triggerKind: "scheduled",
        scheduleIsraelDateKey,
        policy,
        catalog,
        failureCategory: "blocked_credit_limit",
        startedAt: now,
        completedAt: now,
      });
    }
    return blockedResult("credit_limit", creditLimitMessageHebrew());
  }

  if (triggerKind === "manual") {
    const latestRun = await findLatestForCooldown();
    if (latestRun?.completedAt) {
      const remaining = computeCooldownRemainingSeconds({
        lastCompletedAt: new Date(latestRun.completedAt),
        cooldownMinutes: policy.limits.runCooldownMinutes,
        now,
      });
      if (remaining > 0) {
        return blockedResult(
          "cooldown",
          `Discovery is on cooldown. Try again in about ${remaining} seconds.`,
          remaining
        );
      }
    }
  }

  let beginResult;
  try {
    beginResult = await tryBeginRun({
      triggeredBy,
      triggerKind,
      scheduleIsraelDateKey,
      policy,
      catalog,
      startedAt: now,
    });
  } catch {
    return blockedResult("failed", "Could not start discovery run.");
  }

  if (!beginResult.ok) {
    if (beginResult.reason === "already_running") {
      return blockedResult(
        "already_running",
        "A discovery run is already in progress. Try again later."
      );
    }
    if (beginResult.reason === "already_executed") {
      return blockedResult("failed", "Discovery already executed for this schedule.");
    }
    return blockedResult("failed", "Could not start discovery run.");
  }

  const runId = beginResult.run.id;
  const httpAttemptCounter: TavilyHttpAttemptCounter = { count: 0 };

  const createProvider =
    deps.createProvider ??
    ((counter: TavilyHttpAttemptCounter) =>
      createTavilySearchProviderFromEnv(undefined, counter));

  const provider = createProvider(httpAttemptCounter);
  if (!provider) {
    await failRun({
      runId,
      failureCategory: "provider_unavailable",
      completedAt: now,
    });
    return blockedResult("failed", "Tavily provider is not configured.");
  }

  try {
    const summary = await runDiscovery({
      provider,
      loadCatalog: () => catalog,
      getPolicy: () => policy,
      getClassifier: () => getIntentClassifierForIngest(),
      referenceDate: now,
      tavilyHttpAttemptCounter: httpAttemptCounter,
    });

    const status = deriveDiscoveryRunStatus({ summary });
    const completed = await completeRun({
      runId,
      status,
      summary,
      completedAt: deps.now?.() ?? new Date(),
    });

    if (!completed) {
      return blockedResult("failed", "Discovery finished but run record could not be saved.");
    }

    return {
      success: true,
      runId,
      status,
      summary: toDiscoveryRunSummaryDto(summary),
    };
  } catch {
    await failRun({
      runId,
      failureCategory: "orchestration_error",
      completedAt: deps.now?.() ?? new Date(),
    });
    return blockedResult("failed", "Discovery run failed unexpectedly.");
  }
}

/** Callable from tests and future cron (7B.2B) — no HTTP route in 7B.2A. */
export async function executeScheduledDiscoveryRun(
  input: { scheduleIsraelDateKey: string; referenceDate?: Date },
  deps: ExecuteTavilyDiscoveryRunDeps = {}
): Promise<ScheduledDiscoveryOutcome> {
  const referenceDate = input.referenceDate ?? deps.now?.() ?? new Date();
  const trigger: DiscoveryRunTrigger = {
    kind: "scheduled",
    channel: "vercel_cron",
    scheduleIsraelDateKey: input.scheduleIsraelDateKey,
  };

  const existing = await findScheduledDiscoveryRunForIsraelDate(
    input.scheduleIsraelDateKey
  );
  if (existing) {
    return {
      success: false,
      reason: "already_executed",
      message: "Scheduled discovery already executed for this Israel calendar date.",
      runId: existing.id,
    };
  }

  const result = await executeTavilyDiscoveryRun(trigger, {
    ...deps,
    now: () => referenceDate,
  });

  if (
    !result.success &&
    (result.reason === "already_running" ||
      (result.reason === "failed" &&
        result.message.includes("already executed")))
  ) {
    const raced = await findScheduledDiscoveryRunForIsraelDate(
      input.scheduleIsraelDateKey
    );
    if (raced) {
      return {
        success: false,
        reason: "already_executed",
        message: "Scheduled discovery already executed for this Israel calendar date.",
        runId: raced.id,
      };
    }
  }

  return result;
}

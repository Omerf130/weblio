import type { AdminSessionUser } from "@/lib/auth/session";
import {
  computeCooldownRemainingSeconds,
  createDiscoveryRunRunning,
  completeDiscoveryRun,
  failDiscoveryRun,
  findActiveDiscoveryRun,
  findLatestDiscoveryRunForCooldown,
  isDiscoveryRunStale,
  markStaleDiscoveryRunsFailed,
  toDiscoveryRunSummaryDto,
} from "@/lib/data/discovery-runs";
import { isDiscoveryTavilyEnabled } from "@/lib/discovery/discovery-env";
import {
  getProductionDiscoveryPolicy,
  type DiscoveryPolicy,
} from "@/lib/discovery/discovery-policy";
import { deriveDiscoveryRunStatus } from "@/lib/discovery/discovery-run-status";
import { getIntentClassifierForIngest } from "@/lib/discovery/classifier/get-intent-classifier";
import { runTavilyProductionDiscovery } from "@/lib/discovery/run-tavily-discovery";
import { loadSearchProfileCatalogProduction } from "@/lib/discovery/providers/load-search-profiles";
import { createTavilySearchProviderFromEnv } from "@/lib/discovery/providers/tavily-search-provider";
import type { DiscoverySearchProvider } from "@/lib/discovery/providers/types";
import type {
  RunTavilyDiscoveryActionResult,
  RunTavilyDiscoveryBlockReason,
} from "@/types/discovery-run";

export type ExecuteTavilyDiscoveryRunDeps = {
  isEnabled?: () => boolean;
  getPolicy?: () => DiscoveryPolicy;
  loadCatalog?: typeof loadSearchProfileCatalogProduction;
  createProvider?: () => DiscoverySearchProvider | null;
  runDiscovery?: typeof runTavilyProductionDiscovery;
  markStaleRuns?: typeof markStaleDiscoveryRunsFailed;
  findActiveRun?: typeof findActiveDiscoveryRun;
  findLatestForCooldown?: typeof findLatestDiscoveryRunForCooldown;
  createRunning?: typeof createDiscoveryRunRunning;
  completeRun?: typeof completeDiscoveryRun;
  failRun?: typeof failDiscoveryRun;
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

export async function executeTavilyDiscoveryRun(
  admin: Pick<AdminSessionUser, "email" | "id">,
  deps: ExecuteTavilyDiscoveryRunDeps = {}
): Promise<RunTavilyDiscoveryActionResult> {
  const now = deps.now?.() ?? new Date();
  const isEnabled = deps.isEnabled ?? isDiscoveryTavilyEnabled;
  const getPolicy = deps.getPolicy ?? getProductionDiscoveryPolicy;
  const loadCatalog = deps.loadCatalog ?? loadSearchProfileCatalogProduction;
  const markStaleRuns = deps.markStaleRuns ?? markStaleDiscoveryRunsFailed;
  const findActiveRun = deps.findActiveRun ?? findActiveDiscoveryRun;
  const findLatestForCooldown = deps.findLatestForCooldown ?? findLatestDiscoveryRunForCooldown;
  const createRunning = deps.createRunning ?? createDiscoveryRunRunning;
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

  const catalog = loadCatalog();
  const triggeredBy = admin.email?.trim() || admin.id;

  let runId: string;
  try {
    const running = await createRunning({
      triggeredBy,
      policy,
      catalog,
      startedAt: now,
    });
    runId = running.id;
  } catch {
    return blockedResult("failed", "Could not start discovery run.");
  }

  const createProvider =
    deps.createProvider ??
    (() => createTavilySearchProviderFromEnv());

  const provider = createProvider();
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

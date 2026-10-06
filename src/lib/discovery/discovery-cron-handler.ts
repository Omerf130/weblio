import { getIsraelCalendarDateKey } from "@/lib/admin/israel-calendar-date";
import { executeScheduledDiscoveryRun } from "@/lib/business/discovery/execute-tavily-discovery-run";
import {
  extractBearerToken,
  resolveDiscoveryCronSecret,
  verifyDiscoveryCronSecret,
} from "@/lib/discovery/discovery-cron-auth";
import { formatIsraelLocalTimeForDiagnostics } from "@/lib/discovery/discovery-cron-diagnostic-time";
import {
  defaultDiscoveryCronDiagnosticsPort,
  type DiscoveryCronDiagnosticsPort,
} from "@/lib/discovery/discovery-cron-diagnostics-port";
import { assertProductionDiscoveryAutomationAllowed } from "@/lib/discovery/discovery-production-automation-guard";
import { isWithinDiscoveryScheduleWindow } from "@/lib/discovery/discovery-israel-schedule-window";
import type { DiscoveryCronDiagnosticOutcome } from "@/types/discovery-cron-diagnostic";
import type { ScheduledDiscoveryOutcome } from "@/types/discovery-run";

export type DiscoveryCronOutcome =
  | "completed"
  | "partial"
  | "failed"
  | "already_executed"
  | "already_running"
  | "blocked_credit_limit"
  | "outside_schedule_window"
  | "automation_disabled"
  | "not_production"
  | "cron_secret_missing"
  | "discovery_disabled"
  | "orchestration_error"
  | "unauthorized";

export type DiscoveryCronResponseBody = {
  ok: boolean;
  outcome: DiscoveryCronOutcome;
  scheduleIsraelDateKey?: string;
  runId?: string;
  message?: string;
};

export type HandleDiscoveryCronInput = {
  authorizationHeader: string | null;
  vercelCronSchedule?: string | null;
  env?: Record<string, string | undefined>;
  now?: Date;
  executeScheduled?: typeof executeScheduledDiscoveryRun;
  diagnostics?: DiscoveryCronDiagnosticsPort;
};

function unauthorized(): { status: number; body: DiscoveryCronResponseBody } {
  return {
    status: 401,
    body: { ok: false, outcome: "unauthorized", message: "Unauthorized" },
  };
}

function skipped(
  outcome: DiscoveryCronOutcome,
  extra: Partial<DiscoveryCronResponseBody> = {}
): { status: number; body: DiscoveryCronResponseBody } {
  return {
    status: 200,
    body: { ok: true, outcome, ...extra },
  };
}

function mapScheduledResult(
  scheduleIsraelDateKey: string,
  result: ScheduledDiscoveryOutcome
): { status: number; body: DiscoveryCronResponseBody } {
  if (result.success) {
    const outcome: DiscoveryCronOutcome =
      result.status === "partial"
        ? "partial"
        : result.status === "failed"
          ? "failed"
          : "completed";
    return {
      status: 200,
      body: {
        ok: true,
        outcome,
        scheduleIsraelDateKey,
        runId: result.runId,
      },
    };
  }

  if ("reason" in result && result.reason === "already_executed") {
    return skipped("already_executed", {
      scheduleIsraelDateKey,
      runId: result.runId,
      message: result.message,
    });
  }

  switch (result.reason) {
    case "credit_limit":
      return skipped("blocked_credit_limit", { scheduleIsraelDateKey, message: result.message });
    case "already_running":
      return skipped("already_running", { scheduleIsraelDateKey, message: result.message });
    case "disabled":
      return skipped("discovery_disabled", { scheduleIsraelDateKey, message: result.message });
    case "failed":
    default:
      return {
        status: 500,
        body: {
          ok: false,
          outcome: "failed",
          scheduleIsraelDateKey,
          message: "Discovery run failed",
        },
      };
  }
}

function toDiagnosticOutcome(outcome: DiscoveryCronOutcome): DiscoveryCronDiagnosticOutcome {
  return outcome;
}

export async function handleDiscoveryCronRequest(
  input: HandleDiscoveryCronInput
): Promise<{ status: number; body: DiscoveryCronResponseBody }> {
  const env = input.env ?? process.env;
  const now = input.now ?? new Date();
  const executeScheduled = input.executeScheduled ?? executeScheduledDiscoveryRun;
  const diagnostics = input.diagnostics ?? defaultDiscoveryCronDiagnosticsPort;
  const scheduleIsraelDateKeyAtInvoke = getIsraelCalendarDateKey(now);
  const israelLocalTime = formatIsraelLocalTimeForDiagnostics(now);
  const vercelCronSchedule = input.vercelCronSchedule?.trim() || undefined;

  const attemptId = await diagnostics.beginAttempt({
    invokedAt: now,
    israelLocalTime,
    scheduleIsraelDateKey: scheduleIsraelDateKeyAtInvoke,
    vercelCronSchedule,
    environment: env.VERCEL_ENV,
  });

  const finish = async (response: { status: number; body: DiscoveryCronResponseBody }) => {
    await diagnostics.recordOutcome(attemptId, {
      outcome: toDiagnosticOutcome(response.body.outcome),
      httpStatus: response.status,
      scheduleIsraelDateKey: response.body.scheduleIsraelDateKey ?? scheduleIsraelDateKeyAtInvoke,
      details: response.body.message,
      discoveryRunId: response.body.runId,
    });
    return response;
  };

  const token = extractBearerToken(input.authorizationHeader);
  const expectedSecret = resolveDiscoveryCronSecret(env);

  if (!verifyDiscoveryCronSecret(token, expectedSecret)) {
    return finish(unauthorized());
  }

  const guard = assertProductionDiscoveryAutomationAllowed(env);
  if (!guard.ok) {
    if (guard.reason === "not_production") {
      return finish(skipped("not_production"));
    }
    if (guard.reason === "cron_secret_missing") {
      return finish(skipped("cron_secret_missing"));
    }
    return finish(skipped("automation_disabled"));
  }

  if (!isWithinDiscoveryScheduleWindow(now)) {
    return finish(
      skipped("outside_schedule_window", {
        scheduleIsraelDateKey: scheduleIsraelDateKeyAtInvoke,
      })
    );
  }

  const scheduleIsraelDateKey = scheduleIsraelDateKeyAtInvoke;

  await diagnostics.recordOutcome(attemptId, {
    outcome: "started",
    httpStatus: 102,
    scheduleIsraelDateKey,
    details: "orchestration_entered",
  });

  try {
    const result = await executeScheduled(
      { scheduleIsraelDateKey, referenceDate: now },
      { now: () => now }
    );
    return finish(mapScheduledResult(scheduleIsraelDateKey, result));
  } catch {
    console.error("[discovery-cron] Unexpected handler error");
    return finish({
      status: 500,
      body: {
        ok: false,
        outcome: "orchestration_error",
        scheduleIsraelDateKey,
        message: "Internal error",
      },
    });
  }
}

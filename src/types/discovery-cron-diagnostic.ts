/** Persisted outcome for a single Discovery cron HTTP invocation. */
export type DiscoveryCronDiagnosticOutcome =
  | "unauthorized"
  | "automation_disabled"
  | "not_production"
  | "cron_secret_missing"
  | "outside_schedule_window"
  | "already_executed"
  | "discovery_disabled"
  | "already_running"
  | "blocked_credit_limit"
  | "started"
  | "completed"
  | "partial"
  | "failed"
  | "orchestration_error";

export const DISCOVERY_CRON_DIAGNOSTIC_OUTCOMES: readonly DiscoveryCronDiagnosticOutcome[] =
  [
    "unauthorized",
    "automation_disabled",
    "not_production",
    "cron_secret_missing",
    "outside_schedule_window",
    "already_executed",
    "discovery_disabled",
    "already_running",
    "blocked_credit_limit",
    "started",
    "completed",
    "partial",
    "failed",
    "orchestration_error",
  ] as const;

export type DiscoveryCronDiagnosticDto = {
  id: string;
  invokedAt: string;
  outcome: DiscoveryCronDiagnosticOutcome;
  httpStatus: number;
  scheduleIsraelDateKey?: string;
  israelLocalTime: string;
  vercelCronSchedule?: string;
  environment?: string;
  details?: string;
  discoveryRunId?: string;
  createdAt: string;
  updatedAt: string;
};

export type BusinessOverviewDiscoveryCronDiagnostics = {
  lastAttempt: DiscoveryCronDiagnosticDto | null;
  lastAttemptLabel: string;
  reachedServerLabel: string;
};

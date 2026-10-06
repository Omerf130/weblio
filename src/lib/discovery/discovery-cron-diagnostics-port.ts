import {
  beginDiscoveryCronDiagnosticAttempt,
  updateDiscoveryCronDiagnosticAttempt,
  type BeginDiscoveryCronDiagnosticInput,
  type RecordDiscoveryCronDiagnosticOutcomeInput,
} from "@/lib/data/discovery-cron-diagnostics";

export type DiscoveryCronDiagnosticsPort = {
  beginAttempt(input: BeginDiscoveryCronDiagnosticInput): Promise<string | null>;
  recordOutcome(
    attemptId: string | null,
    input: RecordDiscoveryCronDiagnosticOutcomeInput
  ): Promise<void>;
};

export const noopDiscoveryCronDiagnosticsPort: DiscoveryCronDiagnosticsPort = {
  beginAttempt: async () => null,
  recordOutcome: async () => {},
};

export const defaultDiscoveryCronDiagnosticsPort: DiscoveryCronDiagnosticsPort = {
  async beginAttempt(input) {
    try {
      return await beginDiscoveryCronDiagnosticAttempt(input);
    } catch {
      console.error("[discovery-cron] Failed to begin diagnostic attempt");
      return null;
    }
  },
  async recordOutcome(attemptId, input) {
    if (!attemptId) {
      return;
    }
    try {
      await updateDiscoveryCronDiagnosticAttempt(attemptId, input);
    } catch {
      console.error("[discovery-cron] Failed to record diagnostic outcome");
    }
  },
};

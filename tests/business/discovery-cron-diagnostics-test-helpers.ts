import type { DiscoveryCronDiagnosticsPort } from "../../src/lib/discovery/discovery-cron-diagnostics-port";
import type {
  BeginDiscoveryCronDiagnosticInput,
  RecordDiscoveryCronDiagnosticOutcomeInput,
} from "../../src/lib/data/discovery-cron-diagnostics";

export type InMemoryDiscoveryCronDiagnosticRecord = BeginDiscoveryCronDiagnosticInput & {
  id: string;
  updates: RecordDiscoveryCronDiagnosticOutcomeInput[];
};

export function createInMemoryDiscoveryCronDiagnosticsPort(): {
  port: DiscoveryCronDiagnosticsPort;
  records: InMemoryDiscoveryCronDiagnosticRecord[];
  reset: () => void;
} {
  const records: InMemoryDiscoveryCronDiagnosticRecord[] = [];
  let seq = 0;

  const port: DiscoveryCronDiagnosticsPort = {
    async beginAttempt(input) {
      const id = `diag-${++seq}`;
      records.push({ id, ...input, updates: [] });
      return id;
    },
    async recordOutcome(attemptId, input) {
      const row = records.find((item) => item.id === attemptId);
      if (row) {
        row.updates.push(input);
      }
    },
  };

  return {
    port,
    records,
    reset: () => {
      records.length = 0;
      seq = 0;
    },
  };
}

export function latestDiagnosticUpdate(
  records: InMemoryDiscoveryCronDiagnosticRecord[]
): RecordDiscoveryCronDiagnosticOutcomeInput | undefined {
  const last = records.at(-1);
  return last?.updates.at(-1);
}

import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { buildBusinessOverviewDiscoveryCronDiagnostics } from "../../src/lib/business/discovery/cron-diagnostics-overview";
import {
  DISCOVERY_CRON_DIAGNOSTIC_RETENTION,
  selectDiscoveryCronDiagnosticIdsToDelete,
} from "../../src/lib/data/discovery-cron-diagnostics";
import { handleDiscoveryCronRequest } from "../../src/lib/discovery/discovery-cron-handler";
import { sanitizeDiscoveryCronDiagnosticDetails } from "../../src/lib/discovery/discovery-cron-diagnostic-sanitize";
import {
  createInMemoryDiscoveryCronDiagnosticsPort,
  latestDiagnosticUpdate,
} from "./discovery-cron-diagnostics-test-helpers";

const CRON_SECRET = "test-cron-secret-not-real";
const IST_WINDOW_UTC = new Date("2026-01-15T00:30:00.000Z");
const OUTSIDE_UTC = new Date("2026-01-15T12:00:00.000Z");

function prodEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    DISCOVERY_CRON_SECRET: CRON_SECRET,
    DISCOVERY_AUTOMATION_ENABLED: "1",
    VERCEL_ENV: "production",
    DISCOVERY_TAVILY_ENABLED: "1",
    ...overrides,
  };
}

const memoryDiagnostics = createInMemoryDiscoveryCronDiagnosticsPort();

function cronInput<T extends Record<string, unknown>>(input: T) {
  return { ...input, diagnostics: memoryDiagnostics.port };
}

beforeEach(() => {
  memoryDiagnostics.reset();
});

describe("Discovery cron diagnostics persistence (in-memory port)", () => {
  it("records outside_schedule_window without calling orchestration", async () => {
    let called = false;
    const res = await handleDiscoveryCronRequest(
      cronInput({
        authorizationHeader: `Bearer ${CRON_SECRET}`,
        env: prodEnv(),
        now: OUTSIDE_UTC,
        vercelCronSchedule: "30 0 * * *",
        executeScheduled: async () => {
          called = true;
          throw new Error("should not run");
        },
      })
    );

    assert.equal(called, false);
    assert.equal(res.body.outcome, "outside_schedule_window");
    assert.equal(memoryDiagnostics.records.length, 1);
    const last = latestDiagnosticUpdate(memoryDiagnostics.records);
    assert.equal(last?.outcome, "outside_schedule_window");
    assert.equal(last?.httpStatus, 200);
    assert.equal(memoryDiagnostics.records[0]?.vercelCronSchedule, "30 0 * * *");
  });

  it("records unauthorized without secret or header contents", async () => {
    const res = await handleDiscoveryCronRequest(
      cronInput({
        authorizationHeader: "Bearer DISCOVERY_CRON_SECRET=leak",
        env: prodEnv(),
        now: IST_WINDOW_UTC,
      })
    );

    assert.equal(res.status, 401);
    const serialized = JSON.stringify(memoryDiagnostics.records);
    assert.equal(latestDiagnosticUpdate(memoryDiagnostics.records)?.outcome, "unauthorized");
    assert.doesNotMatch(serialized, /DISCOVERY_CRON_SECRET=leak/);
    assert.doesNotMatch(serialized, /Bearer/);
  });

  it("records automation_disabled", async () => {
    await handleDiscoveryCronRequest(
      cronInput({
        authorizationHeader: `Bearer ${CRON_SECRET}`,
        env: prodEnv({ DISCOVERY_AUTOMATION_ENABLED: "0" }),
        now: IST_WINDOW_UTC,
      })
    );

    assert.equal(latestDiagnosticUpdate(memoryDiagnostics.records)?.outcome, "automation_disabled");
  });

  it("records started then completed for successful scheduled execution", async () => {
    const res = await handleDiscoveryCronRequest(
      cronInput({
        authorizationHeader: `Bearer ${CRON_SECRET}`,
        env: prodEnv(),
        now: IST_WINDOW_UTC,
        vercelCronSchedule: "30 23 * * *",
        executeScheduled: async () => ({
          success: true,
          runId: "run-scheduled-1",
          status: "completed",
          summary: {
            profilesConfigured: 49,
            profilesSelected: 15,
            selectionShortfallTotal: 0,
            profilesSearched: 15,
            tavilyRequests: 15,
            rawResults: 0,
            filteredMapping: 0,
            filteredValidation: 0,
            filteredDomain: 0,
            filteredDuplicateInRun: 0,
            uniqueCandidates: 0,
            candidatesLimited: 0,
            ingestReceived: 0,
            created: 0,
            rediscovered: 0,
            classified: 0,
            unclassified: 0,
            failed: 0,
            classificationLimit: 45,
            classificationLimitReached: false,
            profileErrorCount: 0,
          },
        }),
      })
    );

    assert.equal(res.body.outcome, "completed");
    const updates = memoryDiagnostics.records[0]?.updates ?? [];
    assert.equal(updates.some((row) => row.outcome === "started"), true);
    assert.equal(updates.at(-1)?.outcome, "completed");
    assert.equal(updates.at(-1)?.discoveryRunId, "run-scheduled-1");
  });

  it("records already_executed without changing orchestration contract", async () => {
    let calls = 0;
    const res = await handleDiscoveryCronRequest(
      cronInput({
        authorizationHeader: `Bearer ${CRON_SECRET}`,
        env: prodEnv(),
        now: IST_WINDOW_UTC,
        executeScheduled: async () => {
          calls += 1;
          return {
            success: false,
            reason: "already_executed",
            message: "done",
            runId: "existing-run",
          };
        },
      })
    );

    assert.equal(calls, 1);
    assert.equal(res.body.outcome, "already_executed");
    assert.equal(latestDiagnosticUpdate(memoryDiagnostics.records)?.outcome, "already_executed");
  });

  it("records failed orchestration outcomes", async () => {
    await handleDiscoveryCronRequest(
      cronInput({
        authorizationHeader: `Bearer ${CRON_SECRET}`,
        env: prodEnv(),
        now: IST_WINDOW_UTC,
        executeScheduled: async () => ({
          success: false,
          reason: "failed",
          message: "Discovery run failed unexpectedly.",
        }),
      })
    );

    assert.equal(latestDiagnosticUpdate(memoryDiagnostics.records)?.outcome, "failed");
    assert.equal(latestDiagnosticUpdate(memoryDiagnostics.records)?.httpStatus, 500);
  });

  it("records orchestration_error when executeScheduled throws", async () => {
    await handleDiscoveryCronRequest(
      cronInput({
        authorizationHeader: `Bearer ${CRON_SECRET}`,
        env: prodEnv(),
        now: IST_WINDOW_UTC,
        executeScheduled: async () => {
          throw new Error("boom");
        },
      })
    );

    assert.equal(latestDiagnosticUpdate(memoryDiagnostics.records)?.outcome, "orchestration_error");
  });
});

describe("Discovery cron diagnostic helpers", () => {
  it("keeps retention bounded to 30 newest attempts", () => {
    const ids = Array.from({ length: 35 }, (_, index) => `id-${index}`);
    const toDelete = selectDiscoveryCronDiagnosticIdsToDelete(ids, DISCOVERY_CRON_DIAGNOSTIC_RETENTION);
    assert.equal(toDelete.length, 5);
    assert.deepEqual(toDelete, ["id-30", "id-31", "id-32", "id-33", "id-34"]);
  });

  it("drops unsafe diagnostic detail strings", () => {
    assert.equal(
      sanitizeDiscoveryCronDiagnosticDetails("Bearer abc123"),
      undefined
    );
    assert.equal(
      sanitizeDiscoveryCronDiagnosticDetails("DISCOVERY_CRON_SECRET value"),
      undefined
    );
    assert.equal(sanitizeDiscoveryCronDiagnosticDetails("safe short note"), "safe short note");
  });

  it("maps overview labels for last cron attempt", () => {
    const view = buildBusinessOverviewDiscoveryCronDiagnostics({
      id: "1",
      invokedAt: "2026-10-05T23:30:00.000Z",
      outcome: "outside_schedule_window",
      httpStatus: 200,
      israelLocalTime: "03:30",
      vercelCronSchedule: "30 0 * * *",
      createdAt: "2026-10-05T23:30:00.000Z",
      updatedAt: "2026-10-05T23:30:00.000Z",
    });
    assert.equal(view.reachedServerLabel, "ה-Cron הגיע לשרת");
    assert.equal(view.lastAttemptLabel, "מחוץ לחלון הזמן");
    assert.equal(view.lastAttempt?.vercelCronSchedule, "30 0 * * *");
  });
});

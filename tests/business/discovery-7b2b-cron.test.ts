import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getIsraelCalendarDateKey } from "../../src/lib/admin/israel-calendar-date";
import {
  resolveDiscoveryCronSecret,
  verifyDiscoveryCronSecret,
} from "../../src/lib/discovery/discovery-cron-auth";
import { handleDiscoveryCronRequest } from "../../src/lib/discovery/discovery-cron-handler";
import {
  getIsraelLocalClock,
  isWithinDiscoveryScheduleWindow,
} from "../../src/lib/discovery/discovery-israel-schedule-window";

const CRON_SECRET = "test-cron-secret-not-real";
const VERCEL_CRON_SECRET = "vercel-platform-cron-secret";
const DISCOVERY_ONLY_SECRET = "discovery-only-secret";

function prodEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    DISCOVERY_CRON_SECRET: CRON_SECRET,
    DISCOVERY_AUTOMATION_ENABLED: "1",
    VERCEL_ENV: "production",
    DISCOVERY_TAVILY_ENABLED: "1",
    ...overrides,
  };
}

function authHeader(secret = CRON_SECRET) {
  return `Bearer ${secret}`;
}

/** ~02:30 IST (UTC+2) → 00:30 UTC same calendar date. */
const IST_WINDOW_UTC = new Date("2026-01-15T00:30:00.000Z");

/** ~02:30 IDT (UTC+3) → 23:30 UTC previous UTC date. */
const IDT_WINDOW_UTC = new Date("2026-07-15T23:30:00.000Z");

describe("7B.2B cron authentication", () => {
  it("rejects missing authorization", async () => {
    const res = await handleDiscoveryCronRequest({
      authorizationHeader: null,
      env: prodEnv(),
      now: IST_WINDOW_UTC,
    });
    assert.equal(res.status, 401);
    assert.equal(res.body.outcome, "unauthorized");
    assert.doesNotMatch(JSON.stringify(res.body), /test-cron-secret/);
  });

  it("rejects invalid secret", async () => {
    const res = await handleDiscoveryCronRequest({
      authorizationHeader: "Bearer wrong-secret",
      env: prodEnv(),
      now: IST_WINDOW_UTC,
    });
    assert.equal(res.status, 401);
  });

  it("uses timing-safe secret verification", () => {
    assert.equal(verifyDiscoveryCronSecret("a", "b"), false);
    assert.equal(verifyDiscoveryCronSecret(CRON_SECRET, CRON_SECRET), true);
  });

  it("accepts Bearer matching CRON_SECRET when DISCOVERY_CRON_SECRET is unset", async () => {
    let called = false;
    const res = await handleDiscoveryCronRequest({
      authorizationHeader: authHeader(VERCEL_CRON_SECRET),
      env: prodEnv({
        DISCOVERY_CRON_SECRET: undefined,
        CRON_SECRET: VERCEL_CRON_SECRET,
      }),
      now: IST_WINDOW_UTC,
      executeScheduled: async () => {
        called = true;
        return {
          success: true,
          runId: "run-vercel-secret",
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
        };
      },
    });
    assert.equal(called, true);
    assert.equal(res.body.outcome, "completed");
    assert.doesNotMatch(JSON.stringify(res.body), new RegExp(VERCEL_CRON_SECRET));
  });

  it("prefers DISCOVERY_CRON_SECRET over CRON_SECRET when both are set", () => {
    assert.equal(
      resolveDiscoveryCronSecret({
        DISCOVERY_CRON_SECRET: DISCOVERY_ONLY_SECRET,
        CRON_SECRET: VERCEL_CRON_SECRET,
      }),
      DISCOVERY_ONLY_SECRET
    );
  });

  it("rejects CRON_SECRET Bearer when DISCOVERY_CRON_SECRET differs", async () => {
    const res = await handleDiscoveryCronRequest({
      authorizationHeader: authHeader(VERCEL_CRON_SECRET),
      env: prodEnv({
        DISCOVERY_CRON_SECRET: DISCOVERY_ONLY_SECRET,
        CRON_SECRET: VERCEL_CRON_SECRET,
      }),
      now: IST_WINDOW_UTC,
    });
    assert.equal(res.status, 401);
  });
});

describe("7B.2B production guard", () => {
  it("does not call scheduled execution when automation disabled", async () => {
    let called = false;
    const res = await handleDiscoveryCronRequest({
      authorizationHeader: authHeader(),
      env: prodEnv({ DISCOVERY_AUTOMATION_ENABLED: "0" }),
      now: IST_WINDOW_UTC,
      executeScheduled: async () => {
        called = true;
        throw new Error("should not run");
      },
    });
    assert.equal(called, false);
    assert.equal(res.body.outcome, "automation_disabled");
    assert.equal(res.status, 200);
  });

  it("does not call scheduled execution on preview", async () => {
    let called = false;
    const res = await handleDiscoveryCronRequest({
      authorizationHeader: authHeader(),
      env: prodEnv({ VERCEL_ENV: "preview" }),
      now: IST_WINDOW_UTC,
      executeScheduled: async () => {
        called = true;
        throw new Error("should not run");
      },
    });
    assert.equal(called, false);
    assert.equal(res.body.outcome, "not_production");
  });
});

describe("7B.2B Israel schedule window", () => {
  it("accepts 02:00, 02:30, and 02:59 Israel time (IST)", () => {
    const at0200 = new Date("2026-01-15T00:00:00.000Z");
    const at0259 = new Date("2026-01-15T00:59:00.000Z");
    assert.equal(getIsraelLocalClock(at0200).hour, 2);
    assert.equal(getIsraelLocalClock(at0200).minute, 0);
    assert.equal(isWithinDiscoveryScheduleWindow(at0200), true);
    assert.equal(isWithinDiscoveryScheduleWindow(IST_WINDOW_UTC), true);
    assert.equal(getIsraelLocalClock(at0259).minute, 59);
    assert.equal(isWithinDiscoveryScheduleWindow(at0259), true);
  });

  it("accepts IDT ~02:30 via 23:30 UTC", () => {
    assert.equal(isWithinDiscoveryScheduleWindow(IDT_WINDOW_UTC), true);
    const clock = getIsraelLocalClock(IDT_WINDOW_UTC);
    assert.equal(clock.hour, 2);
  });

  it("accepts IDT Hobby late fire at 23:59 UTC (02:59 local)", () => {
    const hobbyLateIdt = new Date("2026-07-14T23:59:00.000Z");
    assert.equal(getIsraelLocalClock(hobbyLateIdt).hour, 2);
    assert.equal(getIsraelLocalClock(hobbyLateIdt).minute, 59);
    assert.equal(isWithinDiscoveryScheduleWindow(hobbyLateIdt), true);
  });

  it("rejects 01:59 and 03:00 Israel time", () => {
    const at0159Ist = new Date("2026-01-14T23:59:00.000Z");
    const at0300Ist = new Date("2026-01-15T01:00:00.000Z");
    assert.equal(getIsraelLocalClock(at0159Ist).hour, 1);
    assert.equal(getIsraelLocalClock(at0300Ist).hour, 3);
    assert.equal(isWithinDiscoveryScheduleWindow(at0159Ist), false);
    assert.equal(isWithinDiscoveryScheduleWindow(at0300Ist), false);
  });

  it("rejects wrong-season IST cron (23:30 UTC → 01:30 local)", () => {
    const wrongSeasonIst = new Date("2026-01-14T23:30:00.000Z");
    assert.equal(getIsraelLocalClock(wrongSeasonIst).hour, 1);
    assert.equal(isWithinDiscoveryScheduleWindow(wrongSeasonIst), false);
  });

  it("rejects wrong-season IDT cron (00:30 UTC → 03:30 local)", () => {
    const wrongSeasonIdt = new Date("2026-07-15T00:30:00.000Z");
    assert.equal(getIsraelLocalClock(wrongSeasonIdt).hour, 3);
    assert.equal(isWithinDiscoveryScheduleWindow(wrongSeasonIdt), false);
  });

  it("rejects outside window without calling orchestration", async () => {
    const outside = new Date("2026-01-15T12:00:00.000Z");
    let called = false;
    const res = await handleDiscoveryCronRequest({
      authorizationHeader: authHeader(),
      env: prodEnv(),
      now: outside,
      executeScheduled: async () => {
        called = true;
        throw new Error("should not run");
      },
    });
    assert.equal(called, false);
    assert.equal(res.body.outcome, "outside_schedule_window");
    assert.equal(res.body.scheduleIsraelDateKey, getIsraelCalendarDateKey(outside));
  });
});

describe("7B.2B scheduled orchestration adapter", () => {
  it("calls executeScheduledDiscoveryRun once with Israel date key", async () => {
    let calls = 0;
    let capturedKey = "";
    const res = await handleDiscoveryCronRequest({
      authorizationHeader: authHeader(),
      env: prodEnv(),
      now: IST_WINDOW_UTC,
      executeScheduled: async (input) => {
        calls += 1;
        capturedKey = input.scheduleIsraelDateKey;
        return {
          success: true,
          runId: "run-1",
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
        };
      },
    });

    assert.equal(calls, 1);
    assert.equal(capturedKey, getIsraelCalendarDateKey(IST_WINDOW_UTC));
    assert.equal(res.body.outcome, "completed");
    assert.equal(res.body.runId, "run-1");
    assert.doesNotMatch(JSON.stringify(res.body), new RegExp(CRON_SECRET));
  });

  it("maps already_executed without paid work", async () => {
    const res = await handleDiscoveryCronRequest({
      authorizationHeader: authHeader(),
      env: prodEnv(),
      now: IST_WINDOW_UTC,
      executeScheduled: async () => ({
        success: false,
        reason: "already_executed",
        message: "done",
        runId: "existing",
      }),
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.outcome, "already_executed");
  });

  it("maps credit_limit to blocked_credit_limit", async () => {
    const res = await handleDiscoveryCronRequest({
      authorizationHeader: authHeader(),
      env: prodEnv(),
      now: IST_WINDOW_UTC,
      executeScheduled: async () => ({
        success: false,
        reason: "credit_limit",
        message: "blocked",
      }),
    });
    assert.equal(res.body.outcome, "blocked_credit_limit");
  });

  it("maps already_running skip", async () => {
    const res = await handleDiscoveryCronRequest({
      authorizationHeader: authHeader(),
      env: prodEnv(),
      now: IST_WINDOW_UTC,
      executeScheduled: async () => ({
        success: false,
        reason: "already_running",
        message: "busy",
      }),
    });
    assert.equal(res.body.outcome, "already_running");
  });
});

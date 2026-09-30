import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { MANUAL_INTENT_CLASSIFIER_VERSION } from "../../src/lib/business/intents/rules";
import {
  evaluateReclassifyEligibility,
  RECLASSIFY_TAVILY_MAX_INTENTS,
  runReclassifyTavilyIntents,
  type ReclassifyIntentCandidate,
  type ReclassifyTimeWindow,
} from "../../src/lib/business/intents/reclassify-tavily-intents";
import { buildOpenAIClassifierVersion, DEFAULT_OPENAI_INTENT_MODEL } from "../../src/lib/discovery/classifier/openai-env";

const window: ReclassifyTimeWindow = {
  discoveryRunId: "run-1",
  startedAt: new Date("2026-09-30T10:00:00.000Z"),
  completedAt: new Date("2026-09-30T10:30:00.000Z"),
};

function candidate(
  overrides: Partial<ReclassifyIntentCandidate> & Pick<ReclassifyIntentCandidate, "id">
): ReclassifyIntentCandidate {
  return {
    content: "מחפש בונה אתרים",
    provider: "tavily",
    status: "new",
    classification: "unclassified",
    discoveredAt: new Date("2026-09-30T10:15:00.000Z"),
    ...overrides,
  };
}

describe("reclassify tavily intents eligibility", () => {
  it("allows prompt-v1 and unclassified tavily rows in window", () => {
    assert.equal(
      evaluateReclassifyEligibility({
        intent: candidate({
          id: "1",
          classifierVersion: "openai-responses:gpt:prompt-v1",
          classification: "explicitNeed",
        }),
        window,
      }).eligible,
      true
    );
    assert.equal(
      evaluateReclassifyEligibility({
        intent: candidate({ id: "2", classification: "unclassified" }),
        window,
      }).eligible,
      true
    );
  });

  it("skips manual-v1, saved, dev, outside window, and prompt-v2", () => {
    assert.equal(
      evaluateReclassifyEligibility({
        intent: candidate({
          id: "m",
          classifierVersion: MANUAL_INTENT_CLASSIFIER_VERSION,
        }),
        window,
      }).skipReason,
      "manual_v1"
    );
    assert.equal(
      evaluateReclassifyEligibility({
        intent: candidate({ id: "s", status: "saved" }),
        window,
      }).skipReason,
      "saved"
    );
    assert.equal(
      evaluateReclassifyEligibility({
        intent: candidate({ id: "d", provider: "dev" }),
        window,
      }).skipReason,
      "not_tavily"
    );
    assert.equal(
      evaluateReclassifyEligibility({
        intent: candidate({
          id: "o",
          discoveredAt: new Date("2026-09-30T09:00:00.000Z"),
        }),
        window,
      }).skipReason,
      "outside_window"
    );
    assert.equal(
      evaluateReclassifyEligibility({
        intent: candidate({
          id: "v2",
          classifierVersion: buildOpenAIClassifierVersion(DEFAULT_OPENAI_INTENT_MODEL),
        }),
        window,
      }).skipReason,
      "already_prompt_v2"
    );
  });
});

describe("runReclassifyTavilyIntents", () => {
  const discoveryRun = {
    id: "run-1",
    status: "completed" as const,
    startedAt: window.startedAt.toISOString(),
    completedAt: window.completedAt.toISOString(),
    triggeredBy: "admin@example.com",
    policy: {
      policyVersion: 1,
      timeRange: "week",
      excludedDomainCount: 3,
      maxProfilesPerRun: 7,
      maxTavilyRequestsPerRun: 7,
      maxResultsPerQuery: 5,
      maxCandidatesPerRun: 35,
      maxClassificationsPerRun: 20,
    },
    catalog: { catalogVersion: 1, profileCount: 7 },
  };

  it("dry run makes zero AI calls and zero writes", async () => {
    let classifyCalls = 0;
    let writeCalls = 0;

    const summary = await runReclassifyTavilyIntents({
      discoveryRunId: "run-1",
      apply: false,
      deps: {
        loadDiscoveryRun: async () => discoveryRun,
        listTavilyCandidates: async () => [
          candidate({ id: "1", classifierVersion: "openai-responses:x:prompt-v1" }),
        ],
        getClassifier: () => ({
          async classify() {
            classifyCalls += 1;
            return null;
          },
        }),
        updateClassification: async () => {
          writeCalls += 1;
          return true;
        },
      },
    });

    assert.equal(classifyCalls, 0);
    assert.equal(writeCalls, 0);
    assert.equal(summary.mode, "dry_run");
    assert.equal(summary.eligible, 1);
  });

  it("apply requires explicit flag and updates in place", async () => {
    let writes = 0;
    const summary = await runReclassifyTavilyIntents({
      discoveryRunId: "run-1",
      apply: true,
      deps: {
        loadDiscoveryRun: async () => discoveryRun,
        listTavilyCandidates: async () => [candidate({ id: "1" })],
        getClassifier: () => ({
          async classify() {
            return {
              classification: "irrelevant" as const,
              reason: "מציע שירות",
              classifierVersion: buildOpenAIClassifierVersion(DEFAULT_OPENAI_INTENT_MODEL),
            };
          },
        }),
        updateClassification: async () => {
          writes += 1;
          return true;
        },
      },
    });

    assert.equal(summary.classified, 1);
    assert.equal(summary.irrelevant, 1);
    assert.equal(writes, 1);
  });

  it("aborts apply when eligible count exceeds hard max", async () => {
    const many = Array.from({ length: RECLASSIFY_TAVILY_MAX_INTENTS + 1 }, (_, index) =>
      candidate({ id: `id-${index}` })
    );

    const summary = await runReclassifyTavilyIntents({
      discoveryRunId: "run-1",
      apply: true,
      deps: {
        loadDiscoveryRun: async () => discoveryRun,
        listTavilyCandidates: async () => many,
        updateClassification: async () => true,
      },
    });

    assert.equal(summary.aborted, true);
    assert.equal(summary.abortReason, "too_many_eligible_intents");
    assert.equal(summary.classified, 0);
  });

  it("isolates failures per intent during apply", async () => {
    let call = 0;
    const summary = await runReclassifyTavilyIntents({
      discoveryRunId: "run-1",
      apply: true,
      deps: {
        loadDiscoveryRun: async () => discoveryRun,
        listTavilyCandidates: async () => [
          candidate({ id: "1" }),
          candidate({ id: "2" }),
        ],
        getClassifier: () => ({
          async classify() {
            call += 1;
            if (call === 1) {
              throw new Error("fail");
            }
            return {
              classification: "explicitNeed" as const,
              reason: "בקשה",
              classifierVersion: buildOpenAIClassifierVersion(DEFAULT_OPENAI_INTENT_MODEL),
            };
          },
        }),
        updateClassification: async () => true,
      },
    });

    assert.equal(summary.failed, 1);
    assert.equal(summary.classified, 1);
    assert.equal(summary.explicitNeed, 1);
  });
});

describe("reclassify script wiring", () => {
  it("does not reference Tavily search/discovery execution", () => {
    const source = readScript("scripts/reclassify-tavily-intents.ts");
    assert.doesNotMatch(source, /runTavilyProductionDiscovery/);
    assert.doesNotMatch(source, /tavily\.com/);
    assert.match(source, /Default mode is DRY RUN/);
    assert.match(source, /--apply/);
  });
});

function readScript(relativePath: string): string {
  return readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../..", relativePath),
    "utf8"
  );
}

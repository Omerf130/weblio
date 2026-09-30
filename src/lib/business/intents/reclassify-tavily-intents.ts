import { MANUAL_INTENT_CLASSIFIER_VERSION } from "@/lib/business/intents/rules";
import { getIntentClassifierForIngest } from "@/lib/discovery/classifier/get-intent-classifier";
import { OPENAI_INTENT_PROMPT_SUFFIX } from "@/lib/discovery/classifier/openai-env";
import { safeParseIntentClassifierResult } from "@/lib/discovery/classifier/parse-result";
import type { IntentClassifier } from "@/lib/discovery/classifier/types";
import type { DiscoveryRunDto } from "@/types/discovery-run";
import type { IntentClassification, IntentStatus } from "@/types/intent";

export const RECLASSIFY_TAVILY_MAX_INTENTS = 26;

export const OPENAI_PROMPT_V1_MARKER = "prompt-v1";

export type ReclassifyTimeWindow = {
  discoveryRunId: string;
  startedAt: Date;
  completedAt: Date;
};

export type ReclassifyIntentCandidate = {
  id: string;
  title?: string;
  content: string;
  provider: string;
  status: IntentStatus;
  classification: IntentClassification;
  classifierVersion?: string;
  discoveredAt: Date;
  sourcePlatform?: string;
  sourceType?: string;
};

export type ReclassifySkipReason =
  | "not_tavily"
  | "saved"
  | "manual_v1"
  | "outside_window"
  | "already_prompt_v2"
  | "not_target_classification";

export type ReclassifyEligibility = {
  eligible: boolean;
  skipReason?: ReclassifySkipReason;
};

export type ReclassifyDryRunRow = {
  id: string;
  titlePreview: string;
  classification: IntentClassification;
  classifierVersion?: string;
  discoveredAt: string;
  eligible: boolean;
  skipReason?: ReclassifySkipReason;
};

export type ReclassifyRunSummary = {
  mode: "dry_run" | "apply";
  discoveryRunId: string;
  windowStart: string;
  windowEnd: string;
  targeted: number;
  eligible: number;
  classified: number;
  explicitNeed: number;
  possibleNeed: number;
  irrelevant: number;
  failed: number;
  skipped: number;
  aborted: boolean;
  abortReason?: string;
  rows: ReclassifyDryRunRow[];
};

export function buildReclassifyWindowFromDiscoveryRun(
  run: DiscoveryRunDto
): ReclassifyTimeWindow | null {
  if (!run.completedAt) {
    return null;
  }

  return {
    discoveryRunId: run.id,
    startedAt: new Date(run.startedAt),
    completedAt: new Date(run.completedAt),
  };
}

export function isDiscoveredAtInWindow(
  discoveredAt: Date,
  window: ReclassifyTimeWindow
): boolean {
  const time = discoveredAt.getTime();
  return (
    time >= window.startedAt.getTime() && time <= window.completedAt.getTime()
  );
}

export function evaluateReclassifyEligibility(input: {
  intent: Pick<
    ReclassifyIntentCandidate,
    | "provider"
    | "status"
    | "classification"
    | "classifierVersion"
    | "discoveredAt"
  >;
  window: ReclassifyTimeWindow;
}): ReclassifyEligibility {
  const { intent, window } = input;

  if (intent.provider !== "tavily") {
    return { eligible: false, skipReason: "not_tavily" };
  }

  if (intent.status === "saved") {
    return { eligible: false, skipReason: "saved" };
  }

  if (intent.classifierVersion === MANUAL_INTENT_CLASSIFIER_VERSION) {
    return { eligible: false, skipReason: "manual_v1" };
  }

  if (!isDiscoveredAtInWindow(intent.discoveredAt, window)) {
    return { eligible: false, skipReason: "outside_window" };
  }

  if (intent.classifierVersion?.includes(OPENAI_INTENT_PROMPT_SUFFIX)) {
    return { eligible: false, skipReason: "already_prompt_v2" };
  }

  const isUnclassified = intent.classification === "unclassified";
  const isPromptV1 =
    intent.classifierVersion?.includes(OPENAI_PROMPT_V1_MARKER) ?? false;

  if (!isUnclassified && !isPromptV1) {
    return { eligible: false, skipReason: "not_target_classification" };
  }

  return { eligible: true };
}

function titlePreview(title: string | undefined, content: string): string {
  const base = title?.trim() || content.trim().split("\n")[0] || "(ללא כותרת)";
  return base.length > 120 ? `${base.slice(0, 119)}…` : base;
}

export function buildDryRunRows(
  intents: ReclassifyIntentCandidate[],
  window: ReclassifyTimeWindow
): ReclassifyDryRunRow[] {
  return intents.map((intent) => {
    const eligibility = evaluateReclassifyEligibility({ intent, window });
    return {
      id: intent.id,
      titlePreview: titlePreview(intent.title, intent.content),
      classification: intent.classification,
      classifierVersion: intent.classifierVersion,
      discoveredAt: intent.discoveredAt.toISOString(),
      eligible: eligibility.eligible,
      skipReason: eligibility.skipReason,
    };
  });
}

export type ReclassifyTavilyIntentsDeps = {
  loadDiscoveryRun: (id: string) => Promise<DiscoveryRunDto | null>;
  listTavilyCandidates: (window: ReclassifyTimeWindow) => Promise<ReclassifyIntentCandidate[]>;
  getClassifier?: () => IntentClassifier;
  updateClassification: (input: {
    intentId: string;
    classification: IntentClassification;
    classificationReason: string;
    classifierVersion: string;
  }) => Promise<boolean>;
  getIntentById?: (id: string) => Promise<ReclassifyIntentCandidate | null>;
};

export async function runReclassifyTavilyIntents(input: {
  discoveryRunId: string;
  apply: boolean;
  deps: ReclassifyTavilyIntentsDeps;
}): Promise<ReclassifyRunSummary> {
  const run = await input.deps.loadDiscoveryRun(input.discoveryRunId);
  if (!run) {
    return {
      mode: input.apply ? "apply" : "dry_run",
      discoveryRunId: input.discoveryRunId,
      windowStart: "",
      windowEnd: "",
      targeted: 0,
      eligible: 0,
      classified: 0,
      explicitNeed: 0,
      possibleNeed: 0,
      irrelevant: 0,
      failed: 0,
      skipped: 0,
      aborted: true,
      abortReason: "discovery_run_not_found",
      rows: [],
    };
  }

  const window = buildReclassifyWindowFromDiscoveryRun(run);
  if (!window) {
    return {
      mode: input.apply ? "apply" : "dry_run",
      discoveryRunId: input.discoveryRunId,
      windowStart: run.startedAt,
      windowEnd: "",
      targeted: 0,
      eligible: 0,
      classified: 0,
      explicitNeed: 0,
      possibleNeed: 0,
      irrelevant: 0,
      failed: 0,
      skipped: 0,
      aborted: true,
      abortReason: "discovery_run_not_completed",
      rows: [],
    };
  }

  const candidates = await input.deps.listTavilyCandidates(window);
  const rows = buildDryRunRows(candidates, window);
  const eligibleRows = rows.filter((row) => row.eligible);

  const summary: ReclassifyRunSummary = {
    mode: input.apply ? "apply" : "dry_run",
    discoveryRunId: window.discoveryRunId,
    windowStart: window.startedAt.toISOString(),
    windowEnd: window.completedAt.toISOString(),
    targeted: candidates.length,
    eligible: eligibleRows.length,
    classified: 0,
    explicitNeed: 0,
    possibleNeed: 0,
    irrelevant: 0,
    failed: 0,
    skipped: rows.length - eligibleRows.length,
    aborted: false,
    rows,
  };

  if (eligibleRows.length > RECLASSIFY_TAVILY_MAX_INTENTS) {
    summary.aborted = true;
    summary.abortReason = "too_many_eligible_intents";
    if (input.apply) {
      return summary;
    }
    return summary;
  }

  if (!input.apply) {
    return summary;
  }

  const classifier = input.deps.getClassifier?.() ?? getIntentClassifierForIngest();
  const getIntentById = input.deps.getIntentById;

  for (const row of eligibleRows) {
    const liveIntent = getIntentById ? await getIntentById(row.id) : null;
    const intent =
      liveIntent ??
      candidates.find((candidate) => candidate.id === row.id) ??
      null;

    if (!intent) {
      summary.failed += 1;
      continue;
    }

    const eligibility = evaluateReclassifyEligibility({ intent, window });
    if (!eligibility.eligible) {
      summary.skipped += 1;
      continue;
    }

    let classifierOutput;
    try {
      classifierOutput = await classifier.classify({
        content: intent.content,
        title: intent.title,
        sourcePlatform: intent.sourcePlatform,
        sourceType: intent.sourceType,
      });
    } catch {
      summary.failed += 1;
      continue;
    }

    const parsed = safeParseIntentClassifierResult(classifierOutput);
    if (!parsed.ok) {
      summary.failed += 1;
      continue;
    }

    const updated = await input.deps.updateClassification({
      intentId: intent.id,
      classification: parsed.data.classification,
      classificationReason: parsed.data.reason,
      classifierVersion: parsed.data.classifierVersion,
    });

    if (!updated) {
      summary.failed += 1;
      continue;
    }

    summary.classified += 1;
    if (parsed.data.classification === "explicitNeed") {
      summary.explicitNeed += 1;
    } else if (parsed.data.classification === "possibleNeed") {
      summary.possibleNeed += 1;
    } else {
      summary.irrelevant += 1;
    }
  }

  return summary;
}

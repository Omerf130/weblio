# Phase 7B.1 V2.1 — P0 discovery quality fixes

Reference run (pre-fix): `6abe6abfb14005320b24535a` — documented in [webliobusiness-phase7b1-first-run-quality-audit.md](./webliobusiness-phase7b1-first-run-quality-audit.md).

## Root cause

V2 infrastructure (catalog, daily selector, fair caps, classification ordering) worked technically, but quality failed because:

1. **No pre-ingest gates** — raw Tavily rows (adult, careers, unrelated U.S. English) became Intent rows immediately.
2. **Upsert-before-classify** — every surviving candidate created or touched an Intent before classification, flooding the Intent Monitor with unclassified and irrelevant rows.
3. **Weak Tavily scoping** — queries were not scoped to Israel/general where the API allows it.

## New pipeline order (single path)

For each selected search profile:

1. Tavily search (unchanged caps: `search_depth=basic`, `time_range=week`, `max_results=5`).
2. Domain / basic pre-ingest filter (existing; YouTube exclusion retained).
3. **P0 deterministic quality gate** — `evaluateDiscoveryCandidateQuality` (reject before dedupe).
4. In-run URL dedupe.
5. Fair candidate selection (hard cap **85** unchanged).
6. Fair classification ordering (cap **45** unchanged).
7. **Ingest**: classify first for **new** URLs; persist only `explicitNeed` / `possibleNeed`.
8. **Rediscovery**: existing Intent by dedupe key → touch `lastSeenAt` only; no re-classify, no duplicate row.

No second discovery pipeline was added.

## Quality gates (`evaluateDiscoveryCandidateQuality`)

Structured decision: `{ accepted: true }` or `{ accepted: false, reason }`.

| Reason | Purpose |
|--------|---------|
| `unsafe_adult` | Host denylist (e.g. `beastiality.tv`), adult host fragments, high-confidence title/snippet phrases (not single ambiguous words). |
| `jobs_careers` | URL/title/Hebrew employment signals; **buyer intent** preserved (e.g. “מחפש מפתח אתרים שיבנה לי אתר”). |
| `non_israel_or_hebrew` | Requires meaningful Hebrew (≥10 letters), `.il`, Israel URL hints, or Hebrew on international social hosts; rejects English-only U.S. gov/corp with no Hebrew signal. |

Rejected candidates are **never** written to Intents. Counts only on run/profile summaries (no stored explicit rejected content).

## Tavily request scoping (verified)

Inspected `buildTavilySearchRequestBody` in `tavily-search-provider.ts` and V2 policy mapping:

- **`topic: "general"`** — included in request body when set (typed `"general" | "news"`).
- **`country: "israel"`** — included as optional string when set.

V2 production policy sets both via `tavilyRequestPolicyFromDiscoveryPolicy`. No live Tavily call was made during verification. `search_depth`, `time_range`, and `max_results` were not changed.

Provider-level `exclude_domains` remains minimal (YouTube); no large exclude list.

## Classify-before-persist (new URLs)

Flow in `ingestDiscoveredResult`:

1. Resolve dedupe key.
2. If Intent exists → rediscovery touch → `persisted: true`, classification unchanged (including historical `unclassified`).
3. If new and classification cap defers → `skipReason: classification_deferred`, `persisted: false`.
4. If new → classify (unless content-quality auto-skip).
5. Persist only on `explicitNeed` / `possibleNeed` via `createClassifiedDiscoveredIntent`.
6. `irrelevant`, classifier failure, deferred, and auto-skip → `persisted: false` with typed `skipReason`; run metrics record skips.

## Rediscovery behavior

| Case | Behavior |
|------|----------|
| Normalized URL matches existing Intent | `findDiscoveredIntentByDedupeKey` → `touchDiscoveredIntentRediscovery` updates discovery timestamps/count; **classification and status preserved** (dismissed/saved/unclassified stay as-is). |
| New URL | Quality gate → classify → persist only if actionable. |

Cross-run dedupe unchanged (URL-first Tavily identity).

## Metrics additions (backward compatible)

Run summary and per-profile rows include additive fields, e.g.:

- Quality: `filteredQualitySafety`, `filteredQualityLocale`, `filteredQualityCareers` (run); `rejectedSafety`, `rejectedLocale`, `rejectedCareers` (profile).
- Ingest skips: `skippedNotActionable`, `skippedClassificationDeferred` (run); `skippedNotActionable`, `skippedDeferred` (profile).
- `persisted` on ingest outcomes drives `created` / `rediscovered` vs skip buckets.

Older `DiscoveryRun` documents without these fields remain readable (defaults at DTO layer).

## Caps (unchanged)

| Cap | Value |
|-----|--------|
| Candidates (fair selection) | 85 hard |
| Classifications per run | 45 |
| Profiles / Tavily requests (V2 daily) | 29 |

Quality filtering runs **before** the 85 cap so the cap applies to eligible candidates only.

## Limitations

- First-run bad Intent rows are **not** auto-deleted (explicit non-goal).
- Catalog (46 profiles) not retuned in this phase.
- Classifier model/prompt unchanged.
- Hebrew/locale gate is conservative heuristics, not ML.
- Historical unclassified Intents still appear in the monitor until manually handled; new garbage should not be added.

## Second-run manual verification (do not run until approved)

1. Trigger manual discovery via existing admin path (`executeTavilyDiscoveryRun`), same V2 catalog/day as production policy.
2. Confirm **29** profiles → **29** Tavily requests.
3. After completion, inspect run summary metrics: quality reject counts > 0 where expected; `skippedClassificationDeferred` / `skippedNotActionable` visible; **no** new `unsafe_adult` paths in Intent list.
4. Intent Monitor: new rows should be mostly `explicitNeed` / `possibleNeed`; no flood of new `unclassified` from this run.
5. Target: substantially fewer than **72** new persisted Intents (quality over count; rough guide **&lt;25** actionable new rows).
6. Classifier cap still **45**; candidate cap still **85**.
7. Compare profile-level reject metrics to first-run noise profiles (K12, R09, K15, etc.) without changing catalog yet.

No cron, no automated second run, no commit/push as part of this phase.

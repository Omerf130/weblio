# Phase 7B.1 — Search Catalog V2, daily selection, fair pipeline

## Catalog structure

| Tier | Count | IDs |
|------|------:|-----|
| Core | 13 | K01–K13 |
| Rotating | 24 | K14, K15 (demoted from core), R01–R22 |
| Experimental | 9 | X01–X09 |
| **Total** | **46** | |

**File:** `config/discovery/search-profiles.he.v2.prod.json` (`catalogKind: "v2"`, `version: 3`, `environment: "production-v2"`).

**Generator:** `node scripts/build-v2-search-catalog.mjs` (Unicode escapes for Hebrew; avoids `מישהu`-style typos).

### K14 / K15 tier change

- **K14** — WordPress upgrade query → `tier: "rotating"`, `intentStrength: "medium"`.
- **K15** — UX improvement query → `tier: "rotating"`, `intentStrength: "medium"`.
- Core daily count is **13** (not 15); no replacement core queries were invented.

### Typo corrections

Queries were built via `\u05DE\u05D9\u05E9\u05D4\u05D5` (מישהו) in the generator. Validation rejects Hebrew–Latin adjacency (e.g. `מישהu`) while allowing Shopify, WooCommerce, WordPress, SEO, Wix, UX.

## Daily split (29 searches)

| Bucket | Target |
|--------|-------:|
| Core | 13 (all enabled core, every run) |
| Rotating | 13 (window over 24-profile pool) |
| Experimental | 3 (window over 9-profile pool) |

**Module:** `src/lib/discovery/discovery-daily-profile-selector.ts`

**Rotation:** Israel calendar day number (`getIsraelCalendarDayNumber`) drives start index into sorted rotating/experimental pools. Same Israel-local calendar day → same selection; next day advances the window. Disabled profiles are skipped; shortfall is logged on the run summary (`selectionShortfallTotal`).

## Fair candidate selection (85 cap)

After in-run URL dedupe:

1. Per profile: keep up to 4 candidates, sorted by Tavily `score` when present.
2. Round-robin across profiles ordered by `intentStrength` (high → medium → exploratory), then profile id.
3. Stop at **85** total.

**Module:** `src/lib/discovery/fair-candidate-selection.ts`

Legacy W1–W7 catalog (non-V2) still uses first-N slice after dedupe for tests.

## Classification order (45 cap)

Ingest order uses the same profile priority + round-robin interleaving (`orderCandidatesForClassificationPass`). Classifier model/prompt unchanged; only ordering differs for V2.

## Policy caps (manual V2)

| Limit | Value |
|-------|------:|
| `maxProfilesPerRun` / `maxTavilyRequestsPerRun` | 29 |
| `maxCandidatesPerRun` | 85 |
| `maxClassificationsPerRun` | 45 |
| Tavily `time_range` | week |
| `max_results` | 5 |
| `search_depth` | basic |

**Policy version:** 2 — `getV2ProductionDiscoveryPolicy()`. Legacy version 1 unchanged for W1–W7.

## Orchestration

- Manual admin run: `executeTavilyDiscoveryRun` → `runTavilyProductionDiscovery` with V2 catalog + policy by default.
- **Legacy:** `search-profiles.he.prod.json` and `getProductionDiscoveryPolicy()` remain for unit tests and PoC scripts.

## DiscoveryRun additions (additive)

- `profilesSelected`, `selectionShortfallTotal`, `selectedProfileIds[]`
- `catalog.catalogKind` (`v2` when applicable)
- `MAX_DISCOVERY_RUN_PROFILE_SUMMARIES` raised to **32**

## Manual test procedure

1. Set `DISCOVERY_TAVILY_ENABLED=1` and valid Tavily key on the server.
2. Admin → Intent → run discovery manually.
3. Confirm UI message includes selected profile count and Tavily requests.
4. In Mongo `discovery_runs`, verify `selectedProfileIds` (29 ids), `catalog.catalogKind: "v2"`, policy version 2, and metrics within caps.
5. Re-run same Israel day: same `selectedProfileIds`; next calendar day in Israel: rotating/experimental ids should shift.

## Deferred to Phase 7B.2

- Vercel Cron + `CRON_SECRET`
- Morning email, weekly cleanup
- Monthly credit ledger / soft-hard stops
- Adaptive budget
- Profile editor UI

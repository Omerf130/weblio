# Phase 7B.2A — Discovery Automation Infrastructure

**Status:** Implemented (orchestration, ledger, guards). **No cron**, **no Vercel schedule**, **no production automation enablement**.

## Shared orchestration

- Entry: [`executeTavilyDiscoveryRun`](../src/lib/business/discovery/execute-tavily-discovery-run.ts)
- Manual: [`runTavilyDiscoveryAction`](../src/lib/business/discovery/actions.ts) → `{ kind: "manual", admin }`
- Scheduled (callable, not routed): `executeScheduledDiscoveryRun({ scheduleIsraelDateKey })`
- Pipeline unchanged: [`runTavilyProductionDiscovery`](../src/lib/discovery/run-tavily-discovery.ts)

## Trigger model

| Kind | `triggeredBy` | `triggerKind` | `scheduleIsraelDateKey` |
|------|---------------|---------------|-------------------------|
| Manual | Admin email / id | `manual` | unset |
| Scheduled | `scheduled:vercel-cron` | `scheduled` | `YYYY-MM-DD` (Israel) |

Types: [`discovery-run-trigger.ts`](../src/lib/discovery/discovery-run-trigger.ts)

## DiscoveryRun additions

- **Status:** `skipped` (no-spend outcomes; not `failed`)
- **Fields:** `triggerKind`, `scheduleIsraelDateKey`, `activeDiscoverySlot` (internal `global` while `running`), `tavilyHttpAttempts`, `estimatedTavilyCredits`
- **Indexes:** partial unique on scheduled date; partial unique on global active slot while `running`

## Concurrency & idempotency

- [`tryBeginDiscoveryRun`](../src/lib/data/discovery-runs.ts): atomic create with Mongo duplicate-key handling
- Stale `running` → `failed` / `stale_running` (unchanged), clears active slot
- Scheduled: one document per `scheduleIsraelDateKey` (manual runs unaffected)

## Tavily attempt accounting

- Each HTTP POST increments `httpAttemptCounter` ([`tavily-search-provider.ts`](../src/lib/discovery/providers/tavily-search-provider.ts)), including 429/503 retries (max 2 attempts per profile search)
- `tavilyRequests` = logical profile searches (unchanged)
- V1 credits: `estimatedTavilyCredits` = `tavilyHttpAttempts` for `search_depth: basic`

## Monthly ledger

- [`getDiscoveryMonthlyCreditUsage`](../src/lib/data/discovery-monthly-credits.ts)
- Israel calendar month via [`getIsraelMonthStart`](../src/lib/admin/dashboard-time.ts)
- Sums [`estimateTavilyCreditsForRun`](../src/lib/discovery/discovery-run-credits.ts) (fallback: legacy `tavilyRequests`)
- Excludes zero-spend runs

## Credit guard

- Config: [`getDiscoveryCreditConfig`](../src/lib/discovery/discovery-credit-env.ts)
- Defaults (overridable): soft warn **780**, hard stop **950**
- Pre-flight: [`evaluateCreditPreflight`](../src/lib/discovery/discovery-credit-guard.ts) — blocks when `used + (profiles × 2) > hardStop`
- Manual + scheduled; manual **no** skipped DB row on credit block; scheduled may persist `skipped` + `blocked_credit_limit`

## Manual policy

- Admin auth unchanged; **15 min cooldown** (manual-only); counts toward monthly usage; blocked on hard stop / active run

## Scheduled preparation

- No cooldown for `kind: "scheduled"`
- Same credit guard and active-run protection
- `executeScheduledDiscoveryRun` for 7B.2B / tests

## Environment variable NAMES (values not in repo)

| Name | Purpose |
|------|---------|
| `DISCOVERY_AUTOMATION_ENABLED` | Master switch (default off) |
| `DISCOVERY_CRON_SECRET` | Future cron Bearer validation |
| `DISCOVERY_MONTHLY_CREDIT_HARD_STOP` | Pre-Tavily block threshold |
| `DISCOVERY_MONTHLY_CREDIT_SOFT_WARN` | Optional observability threshold |

Existing: `DISCOVERY_TAVILY_ENABLED`, `TAVILY_API_KEY`, OpenAI classifier envs.

## Production guard (7B.2B)

[`assertProductionDiscoveryAutomationAllowed`](../src/lib/discovery/discovery-production-automation-guard.ts) — requires automation enabled, `VERCEL_ENV=production`, cron secret configured. **Not** applied to manual runs.

## Tests

- [`discovery-7b2a-automation.test.ts`](../tests/business/discovery-7b2a-automation.test.ts)
- Updated [`execute-tavily-discovery-run.test.ts`](../tests/business/execute-tavily-discovery-run.test.ts)

## Limitations

- Monthly aggregation queries Mongo (no Tavily balance API)
- Legacy runs without HTTP attempt fields use `tavilyRequests` fallback (may undercount retries)
- Index creation on first deploy may require MongoDB partial index support (4.2+)

## Prerequisites for 7B.2B

1. `GET /api/cron/discovery` + `maxDuration` ≥ 120s
2. `vercel.json` dual UTC crons + Israel hour guard
3. Set env names on Vercel production only
4. Enable `DISCOVERY_AUTOMATION_ENABLED=1` deliberately after smoke tests

No catalog, P0 gates, classifier, or V2.2 policy changes in 7B.2A.

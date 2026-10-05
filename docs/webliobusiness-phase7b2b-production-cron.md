# Phase 7B.2B — Production Cron Wiring

**Status:** Implemented. **Automation remains OFF** until manual Vercel env setup.

## Cron route

- **GET** [`/api/cron/discovery`](../src/app/api/cron/discovery/route.ts)
- Thin adapter → [`handleDiscoveryCronRequest`](../src/lib/discovery/discovery-cron-handler.ts)
- Discovery work: [`executeScheduledDiscoveryRun`](../src/lib/business/discovery/execute-tavily-discovery-run.ts) → shared [`executeTavilyDiscoveryRun`](../src/lib/business/discovery/execute-tavily-discovery-run.ts)

## Authentication

- Header: `Authorization: Bearer <secret>` — validated against `DISCOVERY_CRON_SECRET` if set, else Vercel `CRON_SECRET`
- Timing-safe compare ([`discovery-cron-auth.ts`](../src/lib/discovery/discovery-cron-auth.ts))
- Missing/invalid → **401**, no provider calls
- No query-param secrets; secrets never logged or returned

## Production guard

Requires (all):

- `DISCOVERY_AUTOMATION_ENABLED=1`
- `VERCEL_ENV=production`
- `DISCOVERY_CRON_SECRET` or Vercel `CRON_SECRET` configured (see auth precedence in [`discovery-cron-auth.ts`](../src/lib/discovery/discovery-cron-auth.ts))

Preview/local → **200** `not_production` / `automation_disabled` (no paid work). Manual admin discovery unchanged.

## Israel DST strategy

- **Vercel crons (UTC):** `30 0 * * *` and `30 23 * * *` → same path ([`vercel.json`](../vercel.json))
- **App guard:** [`isWithinDiscoveryScheduleWindow`](../src/lib/discovery/discovery-israel-schedule-window.ts) — **02:00–02:59** (full local hour) `Asia/Jerusalem`
- Wrong seasonal firing → **200** `outside_schedule_window` (no Tavily/OpenAI)

## Idempotency & concurrency

Reuses 7B.2A Mongo:

- `scheduleIsraelDateKey` + partial unique index
- `activeDiscoverySlot` global running lock
- Credit pre-flight before Tavily

## maxDuration

- Route: **`export const maxDuration = 180`** (seconds)
- Observed V2.2 run ~87s; verify [Vercel plan limits](https://vercel.com/docs/functions/routing-middleware/limitations) (Pro typically up to 300s; Hobby differs)

## Environment variable NAMES

| Name | Role |
|------|------|
| `DISCOVERY_AUTOMATION_ENABLED` | Must be `1` to allow scheduled paid runs |
| `DISCOVERY_CRON_SECRET` | Cron Bearer token |
| `DISCOVERY_MONTHLY_CREDIT_HARD_STOP` | 7B.2A credit guard |
| `DISCOVERY_MONTHLY_CREDIT_SOFT_WARN` | Optional warn threshold |
| `DISCOVERY_TAVILY_ENABLED` | Existing server gate |
| `TAVILY_API_KEY` | Existing |
| OpenAI classifier envs | Unchanged |

**Do not commit values.**

## Owner checklist (after deploy, before enablement)

1. Deploy with this code; confirm **`DISCOVERY_AUTOMATION_ENABLED` is unset or `0`** on Production.
2. Generate a strong `DISCOVERY_CRON_SECRET`; set in Vercel **Production** env only.
3. Set credit limits (`DISCOVERY_MONTHLY_CREDIT_HARD_STOP` / optional soft warn).
4. Confirm `DISCOVERY_TAVILY_ENABLED=1` and Tavily/OpenAI keys already work for **manual** runs.
5. Optionally invoke cron manually once with Bearer secret during **02:00–02:59 IL** while automation still **off** → expect `automation_disabled`.
6. Set `DISCOVERY_AUTOMATION_ENABLED=1` when ready for paid daily runs.
7. Monitor first `DiscoveryRun` with `triggerKind: scheduled`.

## Rollback / disable

1. Set `DISCOVERY_AUTOMATION_ENABLED=0` (or remove) — crons may still hit the route but exit before paid work.
2. Remove cron schedules from `vercel.json` and redeploy for full stop.
3. Rotate `DISCOVERY_CRON_SECRET` if exposure suspected.

## Response outcomes (JSON)

`completed`, `partial`, `failed`, `already_executed`, `already_running`, `blocked_credit_limit`, `outside_schedule_window`, `automation_disabled`, `not_production`, `discovery_disabled`, `orchestration_error` (500 only for unexpected errors).

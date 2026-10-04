# Weblio Business — Phase 7A: Business Overview Dashboard (Implementation)

**Status:** Implemented (no commit in this phase step)  
**Route:** `/admin/business`

---

## 1. Architecture

| Layer | Location |
|-------|----------|
| Page (RSC) | `src/app/admin/(protected)/business/page.tsx` |
| Data aggregation | `src/lib/business/overview-dashboard-data.ts` → `getBusinessOverviewDashboardData()` |
| Legacy shim | `src/lib/business/overview-data.ts` (deprecated) |
| UI shell | `src/components/admin/business/overview/BusinessOverviewDashboard.tsx` |
| Styles | `src/components/admin/business/overview/BusinessOverview.module.scss` |

Server flow: parallel Mongo queries → DTO `BusinessOverviewDashboardData` → second parallel fetch for follow-up lead/opportunity summaries only when IDs exist.

---

## 2. KPI definitions

| KPI | Query | Link |
|-----|-------|------|
| לידים חדשים (7d) | `Lead.createdAt >= getIsraelDaysAgo(7)` | `/admin/leads` |
| לידים שלא נקראו | `isRead: false` | `/admin/leads` |
| כוונות לסקירה | `status: new`, `classification ∈ {explicitNeed, possibleNeed}`, `discoveryIngestPath = classified_first` | `/admin/business/intent?status=new` |
| הזדמנויות פעילות | `status ∈ {new, researching, contacted}` | `/admin/business/opportunities` |
| הזדמנויות חדשות (7d) | `status: new`, `createdAt >= 7d` | `/admin/business/opportunities?status=new` |
| מעקבים באיחור | `pending`, `dueAt < start of Israel today` | `/admin/business/follow-ups?filter=overdue` |

Optional comparison: new leads 7d vs previous 7d via `calculatePercentChange` (hidden when prior period is 0).

---

## 3. Dashboard sections

1. **Header** — title + operational subtitle (no period selector).
2. **KPI row** — 6 linked cards with icon accents.
3. **Row 2** — פעילויות קרובות | לידים 7d bar chart | הזדמנויות לפי סטטוס donut + legend.
4. **Row 3** — כוונות Discovery אחרונות (5) | Discovery card (automation health + monthly credits + latest run).

---

## 4. Data-quality filters

- **Intents (Overview KPI + recent list):** require durable creation provenance `discoveryIngestPath = classified_first` (see §10). Excludes legacy Run 1 rows without backfill. No timestamp-delta heuristic.
- **Intents:** also exclude `unclassified` / `irrelevant` via classification filter.
- **Opportunities chart:** only `new`, `researching`, `contacted`.
- **Follow-ups:** only `pending`; activity lists capped (5 overdue, 4 today, 3 upcoming).
- **Discovery credits:** `getDiscoveryMonthlyCreditUsage()` with legacy run fallback via `estimateTavilyCreditsForRun`.

---

## 5. Discovery observability

- **Health:** `deriveDiscoveryAutomationHealth()` + `getDiscoveryAutomationConfig()` + `findScheduledDiscoveryRunForIsraelDate()` + `findActiveDiscoveryRun()`.
- **Latest run:** `findLatestCompletedDiscoveryRun()` (all triggers, terminal statuses).
- **Credits:** progress bar `estimatedCreditsUsed / hardStopLimit` with soft/hard visual states.

Dashboard never triggers Discovery.

---

## 6. Charts

- **Library:** existing `recharts` (BarChart for leads, PieChart donut for opportunities).
- **Leads:** Israel `$dateToString` aggregation + `buildDailyLeadSeries(..., 7)`.
- **Accessibility:** `aria-labelledby`, visually hidden numeric summary (`.srOnly`).

---

## 7. Responsive behavior

- Desktop: 6-column KPI, 3-column row 2, 2-column row 3 (~1180px max width).
- ≤1100px: KPI 3-col; activity full width above charts.
- ≤768px: single column sections; KPI 2-col.
- ≤420px: KPI 1-col.

---

## 8. Tests

`tests/business/business-overview-dashboard.test.ts` — automation health, KPI windows, source contracts.

Run: `npm run test:business`, `npm run build`.

---

## 9. Manual verification checklist

**Desktop**

- [ ] Visual density aligns with approved dashboard reference (KPI icons, row balance, card polish).
- [ ] KPI numbers match Mongo expectations.
- [ ] Activity ordering: overdue → today → upcoming → unread → new opps.
- [ ] Charts readable; donut legend links filter opportunities.
- [ ] Discovery card: health label, credit bar, latest run metrics.

**Mobile**

- [ ] No horizontal scroll; Hebrew labels wrap.
- [ ] KPI grid 2-col then 1-col; charts full width.
- [ ] Touch targets on links/cards.

---

## 10. Files touched (summary)

**Created:** overview components, `overview-dashboard-data.ts`, `automation-health.ts`, tests, this doc.

**Modified:** `page.tsx`, `intents.ts`, `opportunity-conversion.ts`, `discovery-runs.ts`, `follow-ups.ts`, `opportunities.ts`, `types/business.ts`, `overview-data.ts`, intent-opportunity test.

**Schema:** optional Intent fields `discoveryCreatedRunId`, `discoveryIngestPath` (backward compatible).

---

## 11. Intent discovery provenance (Phase 7A follow-up)

### Why timing heuristic was rejected

Read-only audit showed legacy Run 1 actionable Intents had `|classifiedAt − discoveredAt| ≈ 1.8–2s` (async classify in the same ingest pass), while true classify-first persist uses ~0ms. A 250ms/500ms cutoff was brittle; durable fields were required.

### Semantics

| Field | Meaning |
|-------|---------|
| `discoveryCreatedRunId` | `DiscoveryRun` that **first created** this Intent (classify-first path only). |
| `discoveryIngestPath` | `"classified_first"` when created via quality-controlled classify-before-persist. |

Set in `createClassifiedDiscoveredIntent` when `discoveryRunId` is passed from `executeTavilyDiscoveryRun` → `runTavilyProductionDiscovery` → `ingestDiscoveredResult`.

**Rediscovery** (`buildRediscoveryUpdate`) never updates these fields (`REDISCOVERY_PRESERVED_FIELD_KEYS`).

### Business Overview filtering

Shared query: `buildOverviewActionableIntentQuery()` in `overview-actionable-intent-query.ts`:

- `status: new`
- `classification ∈ { explicitNeed, possibleNeed }`
- `discoveryIngestPath: classified_first`

Used by **כוונות לסקירה** KPI (`countClassifiedReviewIntents`) and **כוונות Discovery אחרונות** (`listRecentClassifiedReviewIntents`). Intent Monitor unchanged.

### Legacy behavior

Historical Intents without provenance remain in Mongo and in Intent Monitor; they are **excluded** from Business Overview until manually backfilled (if ever).

### One-time Oct 4 V2.2 backfill (manual)

Script: `scripts/backfill-intent-provenance-oct4-v22.ts`

- Targets **only** Intent `6ac2163796fe4b2c70c5b897` and run `6ac215e996fe4b2c70c5b896`.
- Verifies `status: new`, `classification: possibleNeed`, `discoveryProfileId: X02`.
- Idempotent if already set; refuses other provenance or mismatched expectations.
- **Not executed automatically.** Run manually after review:

`npx tsx --env-file=.env.local scripts/backfill-intent-provenance-oct4-v22.ts`

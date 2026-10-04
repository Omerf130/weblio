# Phase 7B.1 V2.2 — Buyer-intent search catalog tuning

**Evidence:** [webliobusiness-phase7b1-search-catalog-tuning-audit.md](./webliobusiness-phase7b1-search-catalog-tuning-audit.md), DiscoveryRuns `6abe6abfb14005320b24535a` (Run 1), `6abe70ae861cc53a783dde5a` (Run 2).

**Goal:** ~15 quality-first Tavily requests/day with natural Hebrew **buyer/help-seeking** language—not generic “website topic” SERPs.

---

## What changed

| Area | V2.1 | V2.2 |
|------|------|------|
| Catalog `version` | 3 | **4** |
| Catalog `environment` | production-v2 | **production-v2.2** |
| Catalog `strategy` | explicit-intent-v2 | **explicit-intent-v2.2** |
| Policy `version` (DiscoveryRun snapshot) | 2 | **3** |
| Daily selection | 13 + 13 + 3 = 29 | **9 + 4 + 2 = 15** |
| `maxProfilesPerRun` / `maxTavilyRequestsPerRun` | 29 | **15** |
| Total profiles in JSON | 46 | **49** (+3 social experiments) |
| Enabled profiles | 46 | **46** (3 disabled) |

**Unchanged (V2.1 P0):** adult/jobs/locale gates, classify-before-persist, caps 85 / 45, Tavily `topic: general`, `country: israel`, `search_depth: basic`, `time_range: week`, `max_results: 5`.

---

## Final catalog counts

| Tier | Count | Enabled |
|------|------:|--------:|
| core | 9 | 9 |
| rotating | 28 | 28 |
| experimental | 12 | 9 |
| **Total** | **49** | **46** |
| disabled (experimental) | 3 | X06, X08, X09 |

---

## Core set (9) — daily every run

| ID | Query |
|----|--------|
| K01 | מחפש מישהו שיבנה לי אתר לעסק |
| K03 | מחפש המלצה על בונה אתרים לעסק |
| K04 | מחפש הצעת מחיר לבניית אתר לעסק |
| K05 | מחפש מישהו שיבנה לי דף נחיתה לעסק |
| K07 | צריך מישהו שיבנה לי חנות אינטרנטית לעסק |
| K08 | מחפש בונה אתרים לעסק קטן |
| K13 | מחפש מישהו שיבנה דף נחיתה לקמפיין פרסום |
| R05 | מחפש מפתח אתרים לפרויקט של עסק *(promoted)* |
| R06 | מחפש מישהו שיבנה אתר מכירות אונליין *(promoted)* |

**Demoted from core → rotating:** K02, K06, K09, K10, K11, K12.

---

## Rewrites (audit-aligned)

| ID | Notes |
|----|--------|
| K06 | מחפשים מישהו שיעצב מחדש אתר לעסק קטן |
| K09 | … אתר תדמית … **לעסק קטן** |
| K12 | מחפשים בונה אתרים שיתקן אתר שלא עובד טוב בנייד לעסק |
| K14 | מחפש מישהו שישדרג לי אתר WordPress לעסק |
| K15 | מחפשים מישהו לשיפור אתר עסקי (חוויית משתמש) |
| R07 | צריך מישהו שיבנה לי חנות אונליין לעסק קטן |
| R08 | מחפש מישהו שישדרג לי את האתר של העסק |
| R09 | מחפש מישהו שיעצב מחדש אתר לעסק קטן |
| R10 | מחפשים מישהו שיתקן אתר שלא נראה טוב בנייד לעסק |
| R15 | מחפש מישהו שיבנה אתר שעובד טוב גם בנייד לעסק |
| R18 | מחפש מישהו שיבנה לי אתר לעסק עם SEO |
| R19 | מחפש מישהו לתחזוק אתר עסקי |
| R22 | מחפש המלצה על בונה/פלטפורמה לחנות אונליין לעסק קטן |
| X02 | האם כדאי לי כבעל עסק לבנות אתר או להסתפק באינסטגרם |
| X09 | לפני שמזמינים בונה אתר — מחפשים המלצות לעסק קטן *(disabled)* |

*(Source of truth: `config/discovery/search-profiles.he.v2.prod.json` / `scripts/build-v2-search-catalog.mjs`.)*

---

## Disabled profiles

- **X06** — education (LP vs showcase)
- **X08** — Wix vs pro compare
- **X09** — pre-hire design ideas (rewritten but kept off until a later experiment)

IDs remain in catalog with `enabled: false`.

---

## Social experiments (experimental)

| ID | Query prefix |
|----|----------------|
| X10 | `site:facebook.com` + K01-shaped buyer query |
| X11 | `site:facebook.com` + K08-shaped buyer query |
| X12 | `site:instagram.com` + K01-shaped buyer query |

Rotate via the same experimental window (2/day). Same P0 pipeline; no bypass.

---

## Daily selection (V2.2)

- **Targets:** `core: 9`, `rotating: 4`, `experimental: 2` → **15** profiles.
- All enabled core profiles run daily (exactly 9 enabled core rows).
- Rotating/experimental: deterministic Israel-calendar windows; disabled profiles skipped; shortfall allowed; no filler duplication.

---

## Policy

`getV2ProductionDiscoveryPolicy()` → **V2_2_PRODUCTION_DISCOVERY_POLICY** (`version: 3`, 15 requests).  
Legacy **V2_1** policy (29/day) retained as `getV2_1ProductionDiscoveryPolicy()` for tests/history.

DiscoveryRun snapshots: `policyVersion: 3`, `catalogVersion: 4`, `environment: production-v2.2`.

---

## Limitations

- Two production runs cannot prove final catalog; social `site:` effectiveness is **unknown until measured**.
- Rewrites may still retrieve SEO/agency pages via generic Tavily web search.
- Run 2 same-day overlap with Run 1 URLs will still produce high **rediscovery** until corpus ages.
- Classifier and prompts unchanged.

---

## Next manual run (do not execute until approved)

1. **When:** Next **Israel calendar day** (fresh daily rotation + Tavily `week` window).
2. **Expect:** ~**15** Tavily requests; policy v3; catalog v4 / production-v2.2.
3. **Primary success metrics:**
   - ≥1 **persisted** `explicitNeed` or `possibleNeed` (quality over count)
   - Actionable per Tavily request & per classified candidate
   - Irrelevant rate among **new** classifications ↓ vs Run 2’s 27/27
   - Quality-gate reject rate stable (not zero, not flooding)
   - **Zero** unsafe persisted Intents
4. **Not success metrics:** raw result count, total candidates, credit burn toward 29/day.

---

## Implementation files

- `config/discovery/search-profiles.he.v2.prod.json` (generated)
- `scripts/build-v2-search-catalog.mjs`
- `src/lib/discovery/discovery-daily-profile-selector.ts`
- `src/lib/discovery/discovery-policy.ts`
- `src/lib/discovery/providers/validate-v2-search-catalog.ts`
- `src/lib/discovery/discovery-v2-types.ts`
- Tests: `discovery-v2-2-catalog-tuning.test.ts`, updated selector/policy/catalog tests

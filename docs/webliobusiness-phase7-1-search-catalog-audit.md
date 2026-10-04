# Weblio Business — Phase 7.1: Production Search Catalog & Discovery Budget Design

**Status:** Audit / design only (no implementation)  
**Prerequisite:** [webliobusiness-phase7-automation-credit-audit.md](./webliobusiness-phase7-automation-credit-audit.md)  
**Scope:** Intent Discovery expressed online (Tavily + classifier). **Not** Phase 5 Business Discovery / Google Places.

---

## 1. Executive recommendation

| Decision | Recommendation |
|----------|----------------|
| **Catalog V2 size** | **46 profiles** (single JSON catalog with tier metadata) |
| **Searches per automated day** | **29** (fixed target; ~850–900 credits/month) |
| **Split** | **15 core** + **11 rotating** + **3 experimental** per day |
| **`time_range`** | **`week`** globally for V1 (see Section 12) |
| **`max_results`** | **5** per search |
| **`search_depth`** | **`basic`** (1 credit/request) |
| **Candidate cap** | Raise to **85** with **tier-weighted fair selection** (not first-N profile order) |
| **Classifier cap** | Raise to **45** per run |
| **Daily budget mode** | **Fixed 29/day** + monthly soft stop **900** / hard stop **950**; optional simple adaptive divisor in 7B+ |
| **Strategy** | **Option B:** core daily + rotating + small experimental budget (~**10%** of daily searches) |
| **Tuning** | JSON catalog + `enabled` flags + tier tags; review `profileSummaries` after several live days |

**Principle:** Maximize **useful buyer-intent / credit**, not credit burn. V1 catalog will be imperfect by design; tune from real runs.

---

## 2. Current W1–W7 evaluation

Source: [`search-profiles.he.prod.json`](../config/discovery/search-profiles.he.prod.json).  
**Historical run metrics:** **Not available in the repository** (no Mongo fixtures, no exported `DiscoveryRun` aggregates). Sections below label **OBSERVED** vs **HYPOTHESIS**.

### W1 — `explicit_website`

| Field | Value |
|-------|--------|
| **Query** | מחפש מישהו שיבנה לי אתר לעסק |
| **Intent angle** | Direct hire — business website |
| **Buyer stage** | Active search / RFP-style |
| **Strengths (hypothesis)** | Strong explicit verb + “לעסק”; conversational; matches Weblio core |
| **Weaknesses (hypothesis)** | Overlaps W3/W4/W5 phrasing families; may return generic SEO/agency articles |
| **Overlap** | W3 (recommendation), W5 (landing), PoC A3 |
| **False-positive patterns (hypothesis)** | Provider ads, “how to build a site” guides, freelancer marketplaces |
| **OBSERVED performance** | None in repo |
| **Catalog V2** | **Keep as core** → **K01** (same query) |

### W2 — `explicit_ecommerce`

| Field | Value |
|-------|--------|
| **Query** | מחפש מישהו שיבנה לי חנות Shopify |
| **Intent angle** | Explicit ecommerce platform hire |
| **Buyer stage** | Active search |
| **Strengths** | Clear Shopify intent; distinct from generic “website” |
| **Weaknesses** | Shopify-specific; misses WooCommerce/custom store buyers (W7 partial) |
| **Overlap** | W7, future K11 |
| **False-positive patterns** | Shopify tutorials, app promos, agencies selling retainers |
| **OBSERVED** | None |
| **V2** | **Keep core** → **K02** |

### W3 — `explicit_recommendation`

| Field | Value |
|-------|--------|
| **Query** | מחפש המלצה על בונה אתרים לעסק |
| **Intent angle** | Recommendation / vendor selection |
| **Buyer stage** | Consideration → shortlist |
| **Strengths** | Captures “ממליץ/המלצה” wording; forum/social friendly |
| **Weaknesses** | Near-duplicate family with W1/W4; listicle results |
| **Overlap** | W1, W4, PoC A6 |
| **False-positive patterns** | “Top 10 builders” articles, affiliate lists |
| **OBSERVED** | None |
| **V2** | **Keep core** → **K03** |

### W4 — `explicit_quote`

| Field | Value |
|-------|--------|
| **Query** | מחפש הצעת מחיר לבניית אתר לעסק |
| **Intent angle** | Commercial quote request |
| **Buyer stage** | Late consideration / procurement |
| **Strengths** | High commercial intent when post is genuine |
| **Weaknesses** | Price-list SEO pages; “מחירון אתר” content farms |
| **Overlap** | W1, exploratory X01 |
| **False-positive patterns** | Pricing guides, agency landing pages |
| **OBSERVED** | None |
| **V2** | **Keep core** → **K04** |

### W5 — `explicit_landing_page`

| Field | Value |
|-------|--------|
| **Query** | מחפש מישהו שיבנה לי דף נחיתה לעסק |
| **Intent angle** | Landing page hire |
| **Buyer stage** | Active search |
| **Strengths** | Clear landing-page SKU for Weblio |
| **Weaknesses** | Overlap with W1 “אתר”; campaign vs site ambiguity |
| **Overlap** | W1, K13, PoC B1 |
| **False-positive patterns** | Landing page templates, Unbounce-style promos |
| **OBSERVED** | None |
| **V2** | **Keep core** → **K05** |

### W6 — `explicit_redesign`

| Field | Value |
|-------|--------|
| **Query** | האתר שלנו מיושן מחפשים מישהו שיעצב אותו מחדש |
| **Intent angle** | Redesign / replacement (business plural voice) |
| **Buyer stage** | Problem-aware → hire |
| **Strengths** | Distinct “existing site pain” angle |
| **Weaknesses** | Plural “אנחנו” may mismatch many posts; close to PoC D2 (retired from prod string set in tests) |
| **Overlap** | R09, K12, mobile pain queries |
| **False-positive patterns** | Design inspiration posts, before/after portfolios |
| **OBSERVED** | None |
| **V2** | **Keep core** → **K06** |

### W7 — `explicit_ecommerce`

| Field | Value |
|-------|--------|
| **Query** | צריך מישהו שיבנה לי חנות אינטרנטית לעסק |
| **Intent angle** | Generic online store hire |
| **Buyer stage** | Active search |
| **Strengths** | Platform-agnostic ecommerce; complements W2 |
| **Weaknesses** | Overlaps W2; “חנות” can mean physical retail |
| **Overlap** | W2, R06, R07 |
| **False-positive patterns** | Ecommerce platforms marketing, marketplace sellers |
| **OBSERVED** | None |
| **V2** | **Keep core** → **K07** |

**Summary:** W1–W7 are a **reasonable V1 seed** but **under-powered** for coverage (gender variants, mobile/UX, showcase site, upgrade paths) and **under-budget** for 900 credits/month. None should be dropped without live data; all promoted to **core K01–K07** with expanded siblings in rotation/experimental tiers.

---

## 3. Historical discovery evidence

### OBSERVED (in repository)

| Evidence | Finding |
|----------|---------|
| `DiscoveryRun.profileSummaries` schema | Per-profile: `raw`, `afterFilter`, `uniqueAttributed`, `created`, `rediscovered`, `classified`, `explicitNeed`, `possibleNeed`, `irrelevant`, `unclassified`, `errors` |
| Tests | Shape/mapping only ([`discovery-runs-profile-summaries.test.ts`](../tests/business/discovery-runs-profile-summaries.test.ts)); **no production run history** |
| Production catalog tests | Explicit **rejections** of some PoC strings for prod noise ([`search-profiles-catalog.test.ts`](../tests/business/search-profiles-catalog.test.ts)): bare `מחפש בונה אתרים`, `מישהו מכיר בונה אתרים מומלץ`, `מישהו שישדרג לי אתר קיים`, `מחפש מישheu שיעצב מחדש את האתר של העסק` (exact retired strings per tests) |
| Phase 4 docs in `/docs` | **None** found for discovery quality |

### HYPOTHESIS (not in repo)

- W1/W4/W3 likely yield mix of **real posts** and **SEO listicles**; classifier + content-quality gates matter more than raw Tavily volume.
- Daily automation will increase **rediscovered** counts for `time_range: week` (Section 12).

**Action for tuning:** After 7B automation, export last N `DiscoveryRun` documents from production Mongo and rank profiles by `explicitNeed + possibleNeed` per search.

---

## 4. PoC catalog lessons

| Catalog | Profiles | Role |
|---------|----------|------|
| [`search-profiles.he.json`](../config/discovery/search-profiles.he.json) PoC1 | 12 (A–E) | Broader mix including **E1–E3 “possible need”** questions |
| [`search-profiles.he.poc2.json`](../config/discovery/search-profiles.he.poc2.json) | 12 (A–D) | Gender variants + recommendation + upgrade phrasing |
| Production W1–W7 | 7 | Trimmed explicit-intent set |

**Useful concepts not in W1–W7 (reference only):**

- Feminine phrasing (A2, A4, B2, C2) → **rotating**, not 7× daily gender swap on core.
- PoC1 **E-series** (“האם צריך אתר”) → **experimental** tier only (weaker hire intent).
- PoC1 **A1** small business, **D2** upgrade wording → adapted in V2 core/rotate.
- **Rejected for prod** (tests): ultra-short or noisy strings — do not promote verbatim.

**Do not** import Google Places / business-verification PoC into this catalog.

---

## 5. Intent-family taxonomy (V2)

| Family | Code | Description | V2 share (profiles) |
|--------|------|-------------|---------------------|
| **A. Direct provider search** | `direct_hire` | מחפש/צריך + person to build | ~18 |
| **B. Specific website need** | `specific_need` | תדמית, נחיתה, חנות, רספונסיבי | ~12 |
| **C. Existing site problem** | `site_problem` | מיושן, mobile, redesign, upgrade | ~8 |
| **D. Research / consideration** | `research` | cost, Wix vs pro, Instagram vs site | ~8 (mostly experimental) |

Families overlap by design; each profile still needs a **distinct discovery reason** (Section 7).

---

## 6. Buyer-intent priority tiers

| Tier | Meaning | Daily Tavily share (of 29) | Profile count in catalog |
|------|---------|----------------------------|---------------------------|
| **HIGH** | Explicit hire / quote / recommendation for builder | **15 core** (~52%) | 15 |
| **MEDIUM** | Clear need, alternate phrasing or sub-SKU | **11 rotating** (~38%) | 22 pool |
| **EXPLORATORY** | Education, “האם כדאי”, pricing research | **3 experimental** (~10%) | 9 pool |

**Not mechanical scoring** — tier is editorial per profile; tuning adjusts tier or `enabled`.

---

## 7. Query variation rules

**Do:**

- One **semantic angle** per profile (hire vs recommend vs quote vs mobile pain).
- Limited **gender variants** in **rotation** only (2–4 profiles total), not 15 duplicates.
- Colloquial Hebrew (“צריך מישהו”, “מחפש המלצה”).
- Platform mentions where SKU matters (Shopify, WooCommerce, WordPress) — **sparingly** (2–3 profiles).

**Do not:**

- 30 profiles differing only by מ/ת.
- Broad dev queries (apps, CRM, generic “מפתח תוכנה”).
- `site:` operators (forbidden by catalog tests).

---

## 8. Query breadth

**Recommendation:** **One intent angle per query**; **narrow–medium** buyer phrasing (5–12 words). Tavily handles semantic breadth; overly broad queries (“אתרים”) increase noise given **`max_results: 5`**.

Avoid OR-like query stuffing; use separate profiles instead.

---

## 9. Source / domain behavior

**Expect:** Indexable forums, Q&A, public posts, articles quoting real questions.  
**Do not expect:** Private Facebook groups, DMs, non-indexed social.

**Current exclusions:** YouTube only ([`discovery-policy.ts`](../src/lib/discovery/discovery-policy.ts)).

**Additional exclusions:** **None recommended for V1** without observed domain noise in `profileSummaries`. Revisit after live runs (e.g. marketplace domains if irrelevant ratio spikes).

**Ingest:** Facebook URLs may be **`aggregated_social`** → auto-classification skipped ([`discovery-content-quality.ts`](../src/lib/discovery/discovery-content-quality.ts)).

---

## 10. Core vs rotating strategy

| Option | Description | Verdict |
|--------|-------------|---------|
| **A** | ~30 searches/day, all unique daily | High cost, less room to test |
| **B** | Core + rotation + experimental | **Recommended** |

**Option B detail:**

- **15 core** every day (includes K01–K07 lineage).
- **11 rotating** / day from **22-profile** pool (**2-day** cycle).
- **3 experimental** / day from **9-profile** pool (**3-day** cycle).

---

## 11. Catalog size vs daily run size

| Approach | Verdict |
|----------|---------|
| Fixed 30-profile catalog, all daily | Too small for rotation; repeats angles |
| **46-profile catalog, 29 selected/day** | **Recommended V1** |
| 60+ profiles | Defer until tuning proves need |

Selection logic lives in **7B** (not V1 admin UI): JSON metadata `tier`, `enabled`, `rotationGroup`.

---

## 12. `time_range` recommendation

| Factor | Assessment |
|--------|------------|
| **`week` today** | Good recall for slow-indexed posts; **high URL overlap** day-to-day → dedupe → `rediscovered` |
| **`day`** | Fresher, fewer duplicates; **risk missing** delayed indexing |
| **Per-profile range** | Useful later (experimental `week`, core `week`) — requires **7B schema/policy** extension |

**V1 recommendation:** Keep global **`time_range: week`**. After 2 weeks of automation, compare `created` vs `rediscovered`; if `rediscovered` dominates with low new actionable Intents, pilot **`day`** on **experimental tier only**.

---

## 13. `max_results` recommendation

| Metric | Value |
|--------|-------|
| Raw rows/day | 29 × 5 = **up to 145** |
| After mapping/validation/domain filter | Lower (hypothesis **70–110**) |
| After in-run dedupe | Hypothesis **50–90** |

**Recommendation:** Keep **`max_results: 5`**. Raising to 10 doubles raw noise before caps with **no extra Tavily credit** but heavier pipeline; only consider after caps and fairness fixed.

---

## 14. Candidate cap recommendation

### OBSERVED pipeline order ([`run-tavily-discovery.ts`](../src/lib/discovery/run-tavily-discovery.ts))

1. Profiles processed in **catalog order**.
2. Candidates accumulated → **dedupe** (first-seen wins).
3. **`slice(0, maxCandidatesPerRun)`** — **early profiles monopolize cap**.
4. Ingest + classify in same order; **20** classification cap.

**Problem at 29 searches:** Later profiles (rotation/experimental) can be **systematically dropped**.

### Recommendation

| Setting | Current | V2 target |
|---------|---------|-----------|
| `maxCandidatesPerRun` | 35 | **85** |

**Fair selection (7B design, not implemented here):**

1. Per profile: take up to **4** candidates after filters (by Tavily `score` desc if present).
2. Merge with **tier weights**: HIGH **1.0**, MEDIUM **0.85**, EXPLORATORY **0.7**.
3. Global sort → take **85**.
4. **Round-robin tie-break** among profiles so no profile id appears 0× in cap.

Cap applied **after dedupe**, **before** ingest (same stage as today).

---

## 15. Classifier cap recommendation

| Factor | Notes |
|--------|-------|
| Model | `gpt-5.4-nano` (unchanged) |
| Post-fair-cap candidates | Often **60–85**; not all need classification if already irrelevant from skip rules |
| Bottleneck | **20** classifications wastes Tavily spend |

**Recommendation:** **`maxClassificationsPerRun: 45`** (~1.5 per search, aligned with fair cap).

Prioritize classification slots for **HIGH tier** candidates first (same fairness pass).

---

## 16. Profile fairness strategy

**Simplest reliable approach (recommended):**

**Tier-weighted cap + per-profile quota + round-robin** (Section 14).

Avoid pure global first-come-first-served on concatenated profile order.

---

## 17. Credit budget model (V1)

Assumptions: **1 credit** per basic search; **29** scheduled searches/day; soft stop before **900** automated credits/month.

| Parameter | Value |
|-----------|-------|
| Automated daily target | **29 credits** |
| Monthly soft stop | **900** |
| Monthly hard stop | **950** |
| Manual + retry reserve | **50–100** (within 1000 plan) |
| Retry reserve | Assume **+2–4 credits/month** average (429 retries) |

### Expected automated usage (29/day)

| Days/month | Credits |
|------------|---------|
| 28 | **812** |
| 29 | **841** |
| 30 | **870** |
| 31 | **899** |

Fits **850–900** target with **~100–150** reserve on a 1000 plan.

---

## 18. Fixed vs adaptive daily budget

| Mode | Pros | Cons |
|------|------|------|
| **A. Fixed 29/day** | Predictable, simple cron | 31-day months near ceiling |
| **B. Adaptive** `min(29, floor(remaining/remainingDays))` | Self-adjusts month length / pauses | More logic, harder to explain |

**Recommendation:** **Fixed 29/day** for V1 + **monthly soft/hard stop**. Add **optional adaptive divisor** in 7B if manual runs consume large share mid-month.

---

## 19. Real-world tuning loop (product)

**Catalog design for operability:**

```json
{
  "id": "K01",
  "enabled": true,
  "tier": "core",
  "intentStrength": "high",
  "queryHe": "..."
}
```

- **Disable** bad profiles (`enabled: false`) without code deploy of engine.
- **Replace** query text in JSON; redeploy.
- **Move tier** core ↔ rotate ↔ experimental.
- **No admin UI required** for V1; optional export of last-run metrics to spreadsheet.

Engine reads catalog + daily selector only.

---

## 20. Metrics for tuning

### Already available (per run, per profile)

`profileSummaries`: searches implied 1/profile/run, `raw`, `afterFilter`, `uniqueAttributed`, `created`, `rediscovered`, `classified`, `explicitNeed`, `possibleNeed`, `irrelevant`, `unclassified`, `errors`.

### Not available (add later — 7D/7E)

| Metric | Gap |
|--------|-----|
| Opportunities / profile | Needs join Intent → Opportunity over time |
| “Useful” human label | Needs 7D feedback |
| Zero-result Tavily rate | Partially `raw === 0` |
| Credit per explicitNeed | Needs ledger + aggregation job |

---

## 21. Profile success measurement (future view)

Simple human-readable ratios per profile (rolling 7–14 days):

- **`explicitNeed / searches`**
- **`(explicitNeed + possibleNeed) / searches`**
- **`irrelevant / classified`**
- **`created / searches`**
- **`errors / searches`**

**Rule of thumb:** If **3+ searches** with **0 created** and high **irrelevant**, demote to experimental or disable.

No AI scoring.

---

## 22. Experimental budget

**Recommendation:** **Yes for V1** — **3 of 29** searches/day (**~10%**), 9-profile pool, 3-day cycle.

Allows testing PoC1-style “האם צריך אתר” without polluting core credit.

Split: **~80% core+rotate / ~10% experimental** (remaining slack = retries/manual).

---

## 23. Search Catalog V2 — complete proposed table

**File (future):** e.g. `config/discovery/search-profiles.he.v2.prod.json` — **not created in 7.1**.

**Global defaults (all profiles):** `search_depth: basic`, `time_range: week`, `max_results: 5`.

### Core daily (15) — run every day

| ID | Query (exact) | Family | Strength | Tier | Rationale | Risk/noise | Source |
|----|---------------|--------|----------|------|-----------|------------|--------|
| K01 | מחפש מישהו שיבנה לי אתר לעסק | direct_hire | HIGH | core | Canonical business website hire | SEO listicles | W1 |
| K02 | מחפש מישהו שיבנה לי חנות Shopify | specific_need | HIGH | core | Shopify SKU | Platform marketing | W2 |
| K03 | מחפש המלצה על בונה אתרים לעסק | direct_hire | HIGH | core | Recommendation intent | Top-N articles | W3 |
| K04 | מחפש הצעת מחיר לבניית אתר לעסק | direct_hire | HIGH | core | Quote stage | Price guides | W4 |
| K05 | מחפש מישהו שיבנה לי דף נחיתה לעסק | specific_need | HIGH | core | Landing page hire | Template SaaS | W5 |
| K06 | האתר שלנו מיושן מחפשים מישהו שיעצב אותו מחדש | site_problem | HIGH | core | Redesign pain | Portfolio posts | W6 |
| K07 | צריך מישהו שיבנה לי חנות אינטרנטית לעסק | specific_need | HIGH | core | Generic ecommerce hire | Retail ambiguity | W7 |
| K08 | מחפש בונה אתרים לעסק קטן | direct_hire | HIGH | core | SMB sizing | Generic agency ads | PoC1 A1 |
| K09 | מחפש מישהו שיבנה לי אתר תדמית לעסק | specific_need | HIGH | core | Showcase site term | Overlap K01 | New |
| K10 | צריך אתר לעסק חדש מי ממליץ על בונה אתרים | direct_hire | HIGH | core | New business + recommend | Forum noise | PoC1 A3 |
| K11 | מחפש מישהו שיבנה חנות WooCommerce לעסק | specific_need | HIGH | core | WooCommerce SKU | Plugin docs | New |
| K12 | האתר שלנו לא נראה טוב במובייל מחפשים מישהו שיתקן | site_problem | HIGH | core | Mobile/responsive pain | Dev tutorials | New |
| K13 | מחפש מישהו שיבנה דף נחיתה לקמפיין פרסום | specific_need | HIGH | core | Campaign landing | Ads/marketing blogs | PoC1 B2 |
| K14 | מחפש שידרוג אתר WordPress לעסק | site_problem | MEDIUM-HIGH | core | WP maintenance/upgrade | Plugin spam | New |
| K15 | מחפש מומחה לשיפור חוויית משתמש באתר עסקי | site_problem | MEDIUM-HIGH | core | UX angle for Weblio | UX articles | New |


### Rotating pool (22) — **11 per day**, 2-day cycle

| ID | Query (exact) | Family | Strength | Rationale | Risk | Source |
|----|---------------|--------|----------|-----------|------|--------|
| R01 | מחפשת מישהו שיבנה לי אתר לעסק | direct_hire | MEDIUM | Feminine variant, distinct results | Overlap K01 | PoC2 A4 |
| R02 | מחפשת המלצה על בונה אתרים לעסק | direct_hire | MEDIUM | Feminine recommendation | Listicles | New |
| R03 | מחפש מישהu שיבנה לי אתר | direct_hire | MEDIUM | Shorter conversational | Less “עסק” filter | PoC2 A3 |
| R04 | מישהu מכיר בונה אתרים אמין | direct_hire | MEDIUM | “מכיר” phrasing | Retired prod variant avoided | PoC1 A2 |
| R05 | מחפש מפתח אתרים לפרויקט של עסק | direct_hire | MEDIUM | Developer synonym | App dev noise | New |
| R06 | מחפש מישהu שיבנה אתר מכירות אונליין | specific_need | MEDIUM | Online sales wording | Ecom platforms | PoC1 C2 |
| R07 | צריך חנות אונליין לעסק קטן | specific_need | MEDIUM | Compact ecommerce | Ambiguous retail | New |
| R08 | מחפש לשדרג את האתר של העסק | site_problem | MEDIUM | Upgrade (prod-safe wording) | Generic SEO | PoC1 D2 |
| R09 | מחפש מישהו שיעצב מחדש אתר לעסק | site_problem | MEDIUM | Redesign alternate | Overlap K06 | Adapt D2 |
| R10 | האתר העסקי לא מותאם לסלולר מחפשים עזרה | site_problem | MEDIUM | Mobile colloquial | Tech support posts | New |
| R11 | מחפש בונה דפי נחיתה לעסקים | specific_need | MEDIUM | LP builder role term | Agencies | New |
| R12 | מחפשת מישהו שיבנה לי דף נחיתה | specific_need | MEDIUM | Feminine LP | Overlap K05 | PoC2 B2 |
| R13 | מחפש מישהו לבניית חנות Shopify | specific_need | MEDIUM | Shopify alternate | Overlap K02 | New |
| R14 | מחפש המלצה על חברה לבניית אתרים | direct_hire | MEDIUM | “חברה” B2B tone | Corporate SEO | New |
| R15 | מחפש מישהו שיבנה אתר רספונסיבי לעסק | specific_need | MEDIUM | Responsive keyword | Dev tutorials | New |
| R16 | צריכה מישהו שיבנה לי אתר לעסק | direct_hire | MEDIUM | Feminine צריכה | Overlap R01 | New |
| R17 | מחפש מישהו שיבנה אתר לסטארטאפ קטן | specific_need | MEDIUM | Startup segment | Non-IL startups | New |
| R18 | מחפש בונה אתרים שמתמחה ב-SEO | direct_hire | MEDIUM | SEO specialty | SEO services ads | New |
| R19 | מחפש מישהו לתחזוקת אתר עסקי | site_problem | MEDIUM | Maintenance retainers | Hosting ads | New |
| R20 | מחפש מעצב אתרים לעסק שלי | direct_hire | MEDIUM | Designer title | Graphic design only | New |
| R21 | מחפש מישהו שיתקן אתר עסקי שבור | site_problem | MEDIUM | Broken site urgency | Support forums | New |
| R22 | מחפש ייעוץ לבחירת פלטפורמה לחנות אונליין | research | MEDIUM | Platform choice | Vendor content | New |

### Experimental pool (9) — **3 per day**, 3-day cycle

| ID | Query (exact) | Family | Strength | Rationale | Risk | Source |
|----|---------------|--------|----------|-----------|------|--------|
| X01 | כמה עולה לבנות אתר לעסק קטן | research | EXPLORATORY | Price research | High SEO noise | New |
| X02 | האם שווה לבנות אתר או להסתפק באינסטגרם לעסק | research | EXPLORATORY | Channel choice | Generic marketing | Adapt E2 |
| X03 | פתחתי עסק חדש האם אני צריך אתר | research | EXPLORATORY | Early funnel | Weak hire intent | PoC1 E1 |
| X04 | עסק מקומי בלי אתר האם זה מפריע | research | EXPLORATORY | Local SMB | Debate threads | PoC1 E3 |
| X05 | איך בוחרים בונה אתרים לעסק | research | EXPLORATORY | Selection guide | How-to articles | New |
| X06 | מה ההבדל בין דף נחיתה לאתר תדמית לעסק | research | EXPLORATORY | Education | Content marketing | New |
| X07 | מחפש חוות דעת על בונה אתרים | research | EXPLORATORY | Reviews | Review farms | New |
| X08 | Wix או בונה אתרים מקצועי מה עדיף לעסק קטן | research | EXPLORATORY | DIY vs pro | Wix affiliate | New |
| X09 | מחפש רעיונות לעיצוב אתר לעסק לפני שמזמינים בונה | research | EXPLORATORY | Pre-hire research | Inspiration pins | New |

**Catalog totals:** **46 profiles** (15 + 22 + 9).

---

## 24. Example 7-day rotation schedule

**Daily total: 29 credits** (15 core + 11 rotate + 3 experimental).

| Day | Core (15) | Rotating (11) | Experimental (3) | Credits |
|-----|-----------|---------------|------------------|---------|
| **Sun** | K01–K15 | R01–R11 | X01, X02, X03 | 29 |
| **Mon** | K01–K15 | R12–R22 | X04, X05, X06 | 29 |
| **Tue** | K01–K15 | R01–R11 | X07, X08, X09 | 29 |
| **Wed** | K01–K15 | R12–R22 | X01, X02, X03 | 29 |
| **Thu** | K01–K15 | R01–R11 | X04, X05, X06 | 29 |
| **Fri** | K01–K15 | R12–R22 | X07, X08, X09 | 29 |
| **Sat** | K01–K15 | R01–R11 | X01, X02, X03 | 29 |

**Week total:** 7 × 29 = **203 credits** (matches ~870/month at 30-day pace).

---

## 25. Phase 7B implementation requirements (exact)

| Area | Change |
|------|--------|
| **Catalog** | New V2 JSON; extend schema: `tier`, `enabled`, `intentStrength`, optional `rotationGroup` |
| **Loader** | Load V2 prod catalog; validate 46 ids; backward-compatible parser |
| **Selection** | Daily profile picker: all enabled core + rotation slice + experimental slice → **29 ids** |
| **Policy** | `maxTavilyRequestsPerRun: 29`, `maxProfilesPerRun: 29`, `maxCandidatesPerRun: 85`, `maxClassificationsPerRun: 45` |
| **Fair cap** | Replace naive `slice(0, N)` with tier-weighted per-profile quota + global merge |
| **Classification order** | Classify HIGH-tier candidates first within cap |
| **Cron** | Protected route → `executeTavilyDiscoveryRun` with `triggeredBy: cron:daily`, cooldown bypass for cron |
| **Credit ledger** | Sum `tavilyRequests` monthly; soft 900 / hard 950 |
| **DiscoveryRun snapshot** | Store selected profile ids + catalog version for reproducibility |
| **Optional later** | Per-profile `time_range` override |

**Do not change in 7.1:** W1–W7 prod file, live code, caps, cron.

---

## 26. Boundary: Intent vs Business Discovery

| | Intent Discovery (7.1) | Business Discovery (deferred) |
|--|------------------------|-------------------------------|
| Signal | Person/business **expresses need online** | Cold prospecting, no website |
| Sources | Tavily web search | Google Places, etc. |
| Catalog | This document | Out of scope |

---

## 27. Risks and open questions

1. **K11/K14 platform queries** — may attract plugin/hosting noise; tune after live data.
2. **Experimental tier** — may inflate `irrelevant`; keep at 3/day max.
3. **Fair cap algorithm** — must be tested under unit tests with 29 mock profiles.
4. **31-day months** — 899 credits at 29/day; soft stop prevents overrun.
5. **Hebrew typo risk** in manual table — validate queries before JSON commit.
6. **Opportunity attribution lag** — profile ROI needs 7D+ joins.
7. **Vercel timeout** — 29 sequential Tavily calls + 45 classifications — measure wall time in 7E.

---

## Explicit Q&A

| Question | Answer |
|----------|--------|
| How many profiles in V2 catalog? | **46** |
| How many run per day? | **29** |
| Core daily? | **15** |
| Rotating per day? | **11** (from 22 pool) |
| Experimental per day? | **3** (from 9 pool) |
| Keep `time_range: week`? | **Yes** for V1 global |
| Keep `max_results: 5`? | **Yes** |
| Candidate cap? | **85** + fair selection |
| Classifier cap? | **45** |
| Prevent early profiles consuming cap? | **Per-profile quota + tier-weighted global merge + round-robin** |
| Credits/day target? | **29** |
| Monthly usage 28/29/30/31? | **812 / 841 / 870 / 899** |
| Fixed or adaptive budget? | **Fixed 29/day** + monthly stops (optional adaptive later) |
| Manual/retry reserve? | **50–100** credits of 1000 plan |
| Know which profiles work? | **`profileSummaries` + human review**; later simple ratios |
| Disable bad profile? | **`enabled: false` in JSON** |
| Phase 7B changes? | Catalog V2, selector, policy caps, fair cap, cron wrapper, ledger, run snapshot |

---

## Related documents

- [webliobusiness-phase7-automation-credit-audit.md](./webliobusiness-phase7-automation-credit-audit.md)

---

*End of Phase 7.1 — documentation only. No catalog file, code, cron, or cap changes in this phase.*

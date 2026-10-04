# Phase 7B.1 — First real V2 run quality audit

**Audit type:** Read-only (MongoDB + code). No Tavily/OpenAI calls, no pipeline or catalog changes, no data deletion.

**Run examined:** Latest completed V2 `DiscoveryRun`  
`id`: `6abe6abfb14005320b24535a` · `startedAt`: 2026-10-01T14:14:23.292Z · `completedAt`: 2026-10-01T14:17:40.448Z · `triggeredBy`: admin manual run · policy v2 · catalog v2 (46 profiles, 29 selected).

---

## 1. Executive diagnosis

Infrastructure behaved as designed (29 searches, fair cap 85, classifier cap 45, persistence + metrics). **Retrieval and ingest policy did not.** Tavily returned broad English/global web pages for Hebrew buyer-intent queries; the pipeline **accepts almost everything** (only YouTube excluded pre-ingest), **creates Intent rows before classification**, and the Intent Monitor **defaults to “inbox” including all unclassified rows**. Outcome: high noise, unacceptable safety failures (adult domains), and admin UI filled with non-actionable URLs.

**Verdict:** **Systemic weak retrieval + missing pre-ingest quality gates**, with **several profile-specific poison paths** (worst: **K12** mobile-fix query → adult domains; **R09** redesign → U.S. institutions; **K15/R08** UX/upgrade → careers).

---

## 2. Actual first-run metrics

| Metric | Value |
|--------|------:|
| Profiles selected / searched | 29 / 29 |
| Tavily requests | 29 |
| Raw Tavily results | 145 (29×5) |
| Pre-ingest filtered (mapping / validation / domain) | 0 / 0 / 0 |
| In-run dedupe removed | 60 |
| Unique candidates ingested (after cap) | 85 |
| Candidates dropped by cap | 0 |
| New Intents created | 72 |
| Rediscovered | 13 |
| Classified (OpenAI) | 45 |
| Remained unclassified | 27 |
| **Classifier labels (created in window)** | **explicitNeed 5 · possibleNeed 0 · irrelevant 40 · unclassified 27** |

Fair selection worked mechanically; **quality was not gated before ingest**.

---

## 3. Profile-by-profile run table

Per-profile metrics from `DiscoveryRun.profileSummaries` (first-wins URL attribution after dedupe+cap). Queries from production V2 catalog.

| Profile | Query (short) | Raw | After filter | Unique attr. | Created | Redisc. | Classified | Explicit | Possible | Irrelevant | Unclass. | Errors | Quality |
|---------|---------------|----:|-------------:|-------------:|--------:|--------:|-----------:|---------:|---------:|-----------:|---------:|-------:|---------|
| K01 | מחפש מישהו שיבנה לי אתר לעסק | 5 | 5 | 5 | 3 | 2 | 1 | 0 | 0 | 3 | 2 | 0 | POOR |
| K02 | … חנות Shopify | 5 | 5 | 4 | 1 | 3 | 1 | 0 | 0 | 4 | 0 | 0 | POOR |
| K03 | … המלצה על בונה אתרים | 5 | 5 | 4 | 3 | 1 | 2 | 0 | 0 | 3 | 1 | 0 | POOR |
| K04 | … הצעת מחיר לבניית אתר | 5 | 5 | 3 | 1 | 2 | 1 | 0 | 0 | 3 | 0 | 0 | POOR |
| K05 | … דף נחיתה לעסק | 5 | 5 | 2 | 2 | 0 | 2 | 0 | 0 | 2 | 0 | 0 | POOR |
| K06 | … מיושן … שיעצב מחדש | 5 | 5 | 5 | 3 | 2 | 2 | 0 | 0 | 4 | 1 | 0 | MIXED |
| K07 | … חנות אינטרנטית | 5 | 5 | 3 | 2 | 1 | 2 | 0 | 0 | 3 | 0 | 0 | POOR |
| K08 | … בונה אתרים לעסק קטן | 5 | 5 | 1 | 1 | 0 | 1 | **1** | 0 | 0 | 0 | 0 | **GOOD** |
| K09 | … אתר תדמית | 5 | 5 | 1 | 1 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | MIXED |
| K10 | … אתר לעסק חדש … ממליץ | 5 | 5 | 2 | 2 | 0 | 2 | 0 | 0 | 2 | 0 | 0 | POOR |
| K11 | … WooCommerce | 5 | 5 | 3 | 3 | 0 | 2 | 0 | 0 | 2 | 1 | 0 | MIXED |
| K12 | … לא נראה טוב במובייל … יתקן | 5 | 5 | 5 | 5 | 0 | 2 | 0 | 0 | 2 | 3 | 0 | **POOR (safety)** |
| K13 | … דף נחיתה לקמפיין | 5 | 5 | 5 | 5 | 0 | 2 | **2** | 0 | 0 | 3 | 0 | **GOOD** |
| R22 | … ייעוץ פלטפורמה לחנות | 5 | 5 | 3 | 3 | 0 | 2 | 0 | 0 | 2 | 1 | 0 | MIXED |
| K14 | … WordPress לעסק | 5 | 5 | 3 | 3 | 0 | 2 | 0 | 0 | 2 | 1 | 0 | MIXED |
| K15 | … UX באתר עסקי | 5 | 5 | 5 | 5 | 0 | 2 | 0 | 0 | 2 | 3 | 0 | MIXED |
| R01 | … מחפשת … אתר | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | MIXED (no ingest) |
| R02 | … מחפשת המלצה | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | MIXED (no ingest) |
| R03 | … מישהו שיבנה לי אתר | 5 | 5 | 2 | 1 | 1 | 1 | 0 | 0 | 2 | 0 | 0 | POOR |
| R04 | … בונה אתרים אמין | 5 | 5 | 2 | 2 | 0 | 2 | 0 | 0 | 2 | 0 | 0 | POOR |
| R05 | … מפתח אתרים לפרויקט | 5 | 5 | 2 | 2 | 0 | 2 | **1** | 0 | 1 | 0 | 0 | **GOOD** |
| R06 | … אתר מכירות אונליין | 5 | 5 | 3 | 3 | 0 | 2 | **1** | 0 | 1 | 1 | 0 | **GOOD** |
| R07 | … חנות אונליין לעסק קטן | 5 | 5 | 2 | 2 | 0 | 2 | 0 | 0 | 2 | 0 | 0 | POOR |
| R08 | … לשדרג את האתר | 5 | 5 | 3 | 2 | 1 | 1 | 0 | 0 | 2 | 1 | 0 | MIXED |
| R09 | … יעצב מחדש אתר | 5 | 5 | 5 | 5 | 0 | 2 | 0 | 0 | 2 | 3 | 0 | **POOR** |
| R10 | … לא מותאם לסלולר | 5 | 5 | 4 | 4 | 0 | 2 | 0 | 0 | 2 | 2 | 0 | MIXED |
| X09 | … רעיונות לעיצוב לפני בונה | 5 | 5 | 5 | 5 | 0 | 2 | 0 | 0 | 2 | 3 | 0 | MIXED |
| X01 | … כמה עולה לבנות אתר | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | MIXED (no ingest) |
| X02 | … אתר או אינסטגרם | 5 | 5 | 3 | 3 | 0 | 2 | 0 | 0 | 2 | 1 | 0 | MIXED |

**Quality key (audit-only heuristic):** GOOD = at least one explicitNeed with low irrelevant noise; POOR = mostly irrelevant / safety / foreign institutional noise; MIXED = otherwise.

**Attribution limit:** Rows dropped at dedupe/cap never become Intents — e.g. R01/R02/X01 show search activity but **0 attributed** (likely deduped by earlier profiles). Rejected Tavily rows are **not stored** anywhere (only aggregate filter counts).

---

## 4. Bad-result attribution (representative)

Intent documents in the run window carry `discoveryProfileId` / `discoveryQuery` (from Tavily `rawMetadata.profileId`). Examples:

| Category | Example | Profile | Query | Class at audit |
|----------|---------|---------|-------|----------------|
| U.S. institution | uschamber.com | **R09** | מחפש מישהו שיעצב מחדש אתר לעסק | unclassified |
| U.S. municipal .gov | deperewi.gov | **R09** | same | unclassified |
| Careers / jobs | careers.jnj.com (he-il) | **K15**, **R08** | UX / upgrade queries | unclassified |
| **Adult / bestiality** | beastiality.tv (multiple URLs) | **K12** | … מובייל … מישהו שיתקן | unclassified / irrelevant |
| Tourism | melia.com (Bulgaria resorts) | **K06** | … מיושן … שיעצב מחדש | irrelevant |
| U.S. parks / tourism | parks.ny.gov | **R22** | … פלטפורמה לחנות אונליין | irrelevant |
| Instagram posts | www.instagram.com/p/… | **14 profiles** (2× K01/K13/K05, spread elsewhere) | various | mostly unclassified |
| Provider guide (IL) | sgo.co.il online-store guide | **K02** | Shopify store query | irrelevant |

**Pattern:** Not one bad profile — **Instagram and English web noise appear across many profiles** — but **K12, R09, K15/R08, R22, K06** are standouts for egregious categories.

---

## 5. Tavily request configuration audit

**What we send today** (`buildTavilySearchRequestBody` + V2 policy):

| Parameter | Value in this run |
|-----------|-------------------|
| `query` | Hebrew profile `queryHe` |
| `search_depth` | `basic` |
| `max_results` | `5` |
| `time_range` | `week` |
| `exclude_domains` | `youtube.com`, `www.youtube.com`, `youtu.be` only |
| `include_answer` | `false` |
| `include_raw_content` | `false` |
| `auto_parameters` | `false` |

**Not sent by our integration (but documented by Tavily Search API):**

| Parameter | Tavily docs | In our codebase |
|-----------|-------------|-----------------|
| `country` | Boost results from a country (e.g. **`israel`**); **only when `topic` is `general`** | **Not implemented** |
| `topic` | e.g. `general`, `news` | **Not implemented** |
| `include_domains` / `exclude_domains` | Up to 300 / 150 domains; wildcards like `*.com` in best-practices | **Only YouTube exclude** |
| `include_raw_content` | Optional full page text | Explicitly `false` |
| `search_depth` | `basic` vs `advanced` (2 credits) | `basic` only |

**Conclusion:** Requests are **minimal global web search** with no Israel boost and almost no domain policy — consistent with foreign English results.

---

## 6. Israel / Hebrew relevance

**Why English pages are accepted**

1. Tavily has no `country: israel` in our requests.
2. Pre-ingest filter does **not** inspect language or geography (`filterMappedRowsForIngest` → mapping, Zod validation, YouTube only).
3. Hebrew queries still retrieve **English SEO pages, U.S. gov, careers, tourism** via fuzzy “website / business / redesign” semantics.

**Recommended conservative gate (V2.1 design, not implemented):**

Pass candidate if **any** of:

- Title + snippet combined contains **≥ N Hebrew letters** (e.g. 8–12), or
- Registrable domain is **`.il`** or common Israeli news/forum hosts (small allowlist, not “only .il”), or
- URL path/lang hints (`/he-il/`, `hl=he`) **and** some Hebrew in snippet, or
- Global platform (facebook.com, instagram.com, reddit.com) **and** Hebrew in title or snippet (keep platform, reject English-only posts).

Fail closed to **skip ingest** (log `filtered_relevance`), not silent rewrite.

---

## 7. Language quality gate

**Evidence available today:** Tavily `title`, `content` snippet (mapped to Intent `title`/`content`), `sourceUrl` / hostname, `rawMetadata.score`, profile id/query.

**Recommended rule:** Deterministic function `assessDiscoveryLocaleRelevance()` before ingest:

- Reject if **Latin-only title** (length > 20) **and** no Hebrew in snippet **and** host not on allowlist.
- Reject known **non-IL government TLDs** for buyer-intent runs: `.gov` (U.S.), `.gov.uk`, state `.us`, etc., unless Hebrew body present (rare edge case → still reject for Weblio v1).

Do **not** require `.il` globally — would drop legitimate Hebrew Facebook/Instagram posts on `facebook.com`.

---

## 8. Unsafe / adult domain filtering

**Why adult content passed**

- No adult domain or keyword gate in pre-ingest or validation.
- YouTube exclusion does not cover tube sites.
- **K12** query (“mobile … fix”) returned **`beastiality.tv`** multiple times (Tavily rank/score); all were **ingested**; several stayed **unclassified** (visible in inbox).

**Maintainable approach (P0):**

1. **Hard block:** hostname matches small regex list (`porn`, `xxx`, `beastiality`, `xnxx`, etc.) — not a huge blacklist.
2. **Title/snippet block:** explicit adult lemmas (English + common transliterations).
3. Optional Tavily **`exclude_domains`** for domains seen in this run (secondary to pattern gate).
4. **Never classify** what is already blocked — drop pre-ingest.

---

## 9. Job / career filtering

**Observed:** `careers.jnj.com` from **K15** (UX expert) and **R08** (upgrade site) — employer career hubs, not buyer posts.

**High-confidence gate:**

- Reject URLs where hostname contains `careers.` or path matches `/jobs`, `/careers`, `/join-us`, known ATS hosts (`greenhouse.io`, `lever.co`, `myworkdayjobs.com`).
- **Do not** reject on Hebrew “מפתח” alone — buyer query R05 legitimately uses “מפתח אתרים”.
- Optional: reject when **title** matches `careers at`, `Explore careers`, `דרושים`, `משרה ב`, **and** page is clearly employer-branded (hostname not a forum/social post).

---

## 10. Seller / provider prefilter

Classifier already marked many agency guides **irrelevant** (e.g. **K02** → sgo.co.il guide).

**High-confidence pre-classifier exclusions only:**

- URL path segments: `/services`, `/portfolio`, `/about-us`, `/pricing` **when** snippet contains first-person seller patterns (`אנחנו בונים`, `אנו מתמחים`, `Our agency builds`) **without** first-person buyer (`אני מחפש`, `לעסק שלי`).
- Known **listicle/SEO** templates in title: “Top 10 web designers”, “מדריך מקיף לבניית אתר” on commercial agency domains.

Keep nuanced buyer/seller distinction in **OpenAI classifier** for borderline cases.

---

## 11. Catalog quality (this run’s 29 only)

| Action | Profiles |
|--------|----------|
| **Keep unchanged (promising signal)** | **K08, K13, R05, R06** (only profiles with explicitNeed hits) |
| **Rewrite candidate (wording too broad / triggers wrong SERP)** | **K12** (mobile fix — catastrophic SERP); **R09** (redesign — U.S. chamber); **R22** (platform advice — tourism/gov); **K06** (redesign — tourism) |
| **Move toward experimental / disable until rewrite** | **X09** (pre-buyer “ideas” — high created, low signal); consider **K15** after careers noise |
| **Monitor next run** | Core K01–K07 — structurally right but **POOR** irrelevant rate; fix gates before disabling |
| **No change yet** | R01/R02 duplicates of core — dedupe prevented ingest this run; evaluate after relevance gates |

Do **not** tune tiers until after V2.1 gates + one more paid run.

---

## 12. Current persistence vs classification order

**Today (`ingestDiscoveredResult`):**

1. Validate normalized input  
2. **`upsertDiscoveredIntent` → Intent row (`classification: unclassified`, `status: new`)**  
3. **`applyClassifierIfNeeded`** (if cap allows real classifier; else noop → stays unclassified)

So **all 72 new rows were persisted before classification**; 27 never received classifier slot and remain **inbox-visible** (`resolveIntentMonitorFilters` default: `status=new`, `classification=inbox` → includes **unclassified**).

**Facebook aggregated_social:** skips auto-classification only; **row still created**.

---

## 13. Recommended persistence architecture (V2.1)

**Recommended for Weblio:** **Classify-then-persist (new URLs only)**

```text
Tavily → pre-ingest quality/safety filters → dedupe → fair cap
  → for each candidate: classify (or rules-only fast reject)
  → persist if explicitNeed | possibleNeed | (optional) audit sample
  → rediscovery: keep existing upsert by URL (no re-classify overwrite)
```

| Topic | Tradeoff |
|-------|----------|
| Rediscovery | Unchanged: URL upsert bumps `lastSeenAt`; classification preserved |
| Auditability | Store **run-level rejected counts** + optional sampled reject reasons on `DiscoveryRun` |
| Classifier failures | No Intent row; counts as `classification_failed` on run summary |
| Unclassified | **Not in main inbox**; optional separate “review queue” later |
| Profile metrics | Count **considered / rejected / persisted** per profile |
| Debugging | Log profileId + reject reason code; no need to pollute Intent collection |

**Alternative (heavier UI change):** Persist all but default monitor to **explicitNeed + possibleNeed only** — still stores garbage and safety risk; **not recommended** vs classify-then-persist.

---

## 14. Classifier cap (45)

After P0 filters, estimated **useful** candidates per run: **~15–30** (not 85). Many current slots burned on irrelevant (40/45 classified were irrelevant labels).

**Recommendation:** Keep **45 as ceiling** for V2.1 test, but expect **< 25** to reach classifier after gates. **Do not increase** before measuring second run. Re-evaluate after 2–3 gated runs.

---

## 15. Candidate cap (85)

85 ingests **85 potential inbox rows** when persistence is upsert-first — wrong optimization target.

**Recommendation:**

- Add **deterministic prefilter before fair cap**.
- Then either **lower cap to ~40–50** or keep 85 as upper bound with expectation of **~20–35 survivors** after filters.
- Do **not** raise cap to “use all Tavily results.”

---

## 16. Product visibility (Intent Monitor)

**Today:** Inbox = `new` + (unclassified | explicitNeed | possibleNeed) — **includes all raw unclassified Tavily hits**.

**Recommendation:** Primary Business view = **`explicitNeed` + `possibleNeed` only** (and saved workflow). Unclassified from discovery **hidden by default** or moved to admin “Discovery review” after classify-then-persist. Irrelevant never inbox by default (already excluded from `inbox` filter when classified irrelevant — but unclassified bypasses that).

No UI redesign in V2.1 — can start with **data policy** (don’t create rows) plus optional default filter change.

---

## 17. P0 / P1 / P2 — Quality pipeline V2.1

### P0 — Before second paid 29-credit run

1. **Adult/safety hostname + title gate** (deterministic).  
2. **Locale relevance gate** (Hebrew / .il / platform+Hebrew — §6).  
3. **Careers/jobs URL gate** (§9).  
4. **Tavily `topic: general` + `country: israel`** in request builder (verify in staging with 1–2 queries; documented API capability).  
5. **Classify-then-persist for new Intents** (keep rediscovery upsert).  
6. **Run summary fields:** `filteredRelevance`, `filteredSafety`, `filteredCareers`, `candidatesConsidered` (additive).

### P1 — Before automation (7B.2)

7. Expand **`exclude_domains`** for repeat offenders (gov US patterns optional — prefer gates).  
8. High-confidence **seller/agency page** prefilter (§10).  
9. Intent Monitor default **inbox = actionable classifications only**.  
10. Catalog rewrites for **K12, R09, R22, K06** after second run data.

### P2 — Multi-day tuning

11. Profile tier disable/enable based on 3+ runs.  
12. `search_depth: advanced` A/B on subset (cost).  
13. Instagram-specific rules (require Hebrew snippet for `/p/` URLs).

---

## V2.1 implementation scope (exact)

- New module: `discovery-candidate-quality-gate.ts` (safety, locale, careers, seller-high-confidence).  
- Wire in `filterMappedRowsForIngest` or immediately after mapping.  
- Extend `buildTavilySearchRequestBody` + policy for `topic` + `country`.  
- Refactor `ingestDiscoveredResult` to classify-before-create for **created** path only.  
- Tests: fixtures from this run’s URLs (beastiality, uschamber, careers.jnj, instagram EN-only).  
- **No catalog JSON changes** in first V2.1 slice (optional query rewrites in follow-up commit).

---

## Second manual paid run plan

1. Implement **P0 only** on a branch; `npm run test:business` + build.  
2. **Do not** delete existing bad Intents (historical evidence); inbox may still show them until manual dismiss or one-time cleanup phase.  
3. Run **one** manual V2 discovery (29 credits).  
4. Success criteria: **0 adult URLs ingested**; **< 25 new Intents**; **≥ 50%** of new rows explicit/possible among classified; **filteredDomain+relevance ≥ 40%** of raw; foreign `.gov` / careers **0 ingested**.  
5. Compare `DiscoveryRun` profile table vs this document; then decide catalog edits.

---

## Evidence limitations

- Individual Tavily rows that failed mapping/validation are not retained (this run: 0).  
- Candidates eliminated by dedupe/cap are not attributable beyond profile search metrics (`raw` vs `uniqueAttributed`).  
- `discoveryProfileId` on Intent reflects **winning profile after dedupe**, not every search that saw the URL.

---

*End of audit — no implementation performed in this phase.*

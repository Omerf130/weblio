# Phase 7B.1 — Search Catalog Tuning Audit V1

**Type:** Read-only audit (MongoDB `discovery_runs`, `intents`, production V2 catalog).  
**Runs:** Run 1 `6abe6abfb14005320b24535a` · Run 2 `6abe70ae861cc53a783dde5a` (same Israel calendar day → **identical 29-profile selection**).  
**No code/catalog changes, no paid APIs.**

---

## 1. Executive diagnosis

The **P0 pipeline is doing its job** (Run 2: 11 quality rejects, 0 unsafe persists, 0 inbox flood). The remaining bottleneck is **search retrieval quality**: generic Tavily web search for Hebrew buyer-intent strings overwhelmingly returns **agency SEO articles, Wikipedia, app stores, tourism, careers, and English institutions**—not **first-person help-seeking posts**.

Across two runs with **29 queries each**:

| Signal | Run 1 | Run 2 (V2.1) |
|--------|------:|-------------:|
| Raw Tavily rows | 145 | 127 |
| Unique candidates ingested | 85 | 68 |
| New Intent rows | 72 | **0** |
| Classifier calls (new URLs in R2) | 45 (cap) | 27 |
| **explicitNeed** (profile-attributed / created window) | **5** | **0** new |
| **possibleNeed** | **0** | **0** |
| Irrelevant (Run 1 labels on created; R2 skipped not actionable) | ~40/45 classified | **27/27** new |

**Only four profiles produced explicitNeed in Run 1:** **K08**, **K13**, **R05**, **R06** (5 labels total; K13 had 2). **Zero possibleNeed** in either run.

**Conclusion:** Catalog **queries are often semantically correct as buyer Hebrew**, but **SERP mix is wrong for our channel** (corporate web >> Facebook-group voice). Tuning must combine **stronger help-seeking wording**, **fewer daily broad/concept queries**, **smaller daily budget**, and **controlled social/platform variants**—not more of the same 29-request day.

---

## 2. Evidence summary (both runs)

### Run-level

- **Selection:** 13 core + K14 + K15 + R01–R10 + R22 + X01, X02, X09 = **29** (both runs).
- **Not selected in either run (17):** R11–R21, X03–X08 — **no Tavily evidence yet**.
- **Run 1 poison paths (Intent + audit):** K12 adult domains; R09 U.S. chamber/municipal; K15/R08 careers; K06 tourism; R22 U.S. parks; broad Instagram/SEO noise on many cores.
- **Run 2:** P0 gates blocked 7 locale (R09×5, X02×2), 4 careers (R10×2, K15×1, R08×1); K12 **0 raw rows** (Tavily variance + `country: israel`); overlap → 40/68 rediscoveries; 28 new URLs all classified **irrelevant**, none persisted.

### What worked (high confidence)

| Profile | Query essence | Evidence |
|---------|---------------|----------|
| **K08** | מחפש בונה אתרים לעסק קטן | Run 1: 1 explicitNeed, low noise |
| **K13** | מחפש מישהו שיבנה דף נחיתה לקמפיין | Run 1: 2 explicitNeed (classifier; noisy unclassified siblings) |
| **R05** | מחפש מפתח אתרים לפרויקט של עסק | Run 1: 1 explicitNeed |
| **R06** | מחפש מישהו שיבנה אתר מכירות אונליין | Run 1: 1 explicitNeed |

### What failed retrieval (high confidence)

| Profile | Issue |
|---------|--------|
| **K12** | Mobile “fix” → adult SERP (R1); empty SERP (R2) |
| **R09** | Redesign → English institutions; R2 **all 5** locale-gated |
| **K15** | “UX expert” → careers + agency content |
| **R08** | “שדרג אתר” → careers |
| **R10** | Mobile colloquial → careers + legal/news |
| **R22** | Platform **consulting** → tourism/gov-style noise |
| **X02** | Platform comparison → app stores / English |
| **X09** | Pre-hire **ideas** → vendor/marketing pages |

---

## 3. Profile-by-profile table (46 profiles)

**Legend:** R1/R2 = participated in run; Attr = unique attributed after dedupe+cap; Exp/Pos/Irr = profile summary counts (Run 1 ingest era); R2 skip = `skippedNotActionable`; Bad = known bad categories from runs + Run 1 audit; Conf = assessment confidence.

| ID | Tier | Strength | Family | Query (abbrev) | R1 | R2 | R1 raw→attr | R1 Exp/Pos/Irr | R2 redisc / skip | Bad categories | Conf | Rec |
|----|------|----------|--------|----------------|:--:|:--:|-------------|----------------|------------------|----------------|------|-----|
| K01 | core | high | explicit_website | מחפש מישהו שיבנה לי אתר לעסק | ✓ | ✓ | 5→5 | 0/0/3 | 5 / 0 | IG, SEO articles | M | KEEP |
| K02 | core | high | explicit_ecommerce | … חנות Shopify | ✓ | ✓ | 5→4 | 0/0/4 | 4 / 0 | Provider guides | M | KEEP |
| K03 | core | high | explicit_recommendation | … המלצה על בונה אתרים | ✓ | ✓ | 5→4 | 0/0/3 | 4 / 0 | SEO, IG | M | KEEP |
| K04 | core | high | explicit_quote | … הצעת מחיר לבניית אתר | ✓ | ✓ | 5→3 | 0/0/3 | 1 / 3 | B2B quotes noise | M | KEEP |
| K05 | core | high | explicit_landing_page | … דף נחיתה לעסק | ✓ | ✓ | 5→2 | 0/0/2 | 2 / 1 | IG vendor posts | M | KEEP |
| K06 | core | high | explicit_redesign | … מיושן … יעצב מחדש | ✓ | ✓ | 5→5 | 0/0/4 | 3 / 1 | Tourism (R1) | H | REWRITE + ROTATE_LOWER |
| K07 | core | high | explicit_ecommerce | צריך … חנות אינטרנטית | ✓ | ✓ | 5→3 | 0/0/3 | 2 / 0 | Payment/SEO pages | M | KEEP |
| K08 | core | high | explicit_website | מחפש בונה אתרים לעסק קטן | ✓ | ✓ | 5→1 | **1**/0/0 | 0 / 1 | Low attr (dedupe) | **H** | **KEEP (core)** |
| K09 | core | high | explicit_website | … אתר תדמית | ✓ | ✓ | 5→1 | 0/0/1 | 0 / 2 | Generic showcase SEO | M | REWRITE |
| K10 | core | high | explicit_recommendation | … עסק חדש מי ממליץ | ✓ | ✓ | 5→2 | 0/0/2 | 2 / 2 | “How to start agency” | M | KEEP |
| K11 | core | high | explicit_ecommerce | … WooCommerce | ✓ | ✓ | 5→3 | 0/0/2 | 1 / 1 | Tech blogs | M | KEEP |
| K12 | core | high | site_problem | … לא נראה טוב במובייל … יתקן | ✓ | ✓ | 5→5 | 0/0/2 | 0 / 0 | **Adult (R1)** | **H** | REWRITE + ROTATE_LOWER |
| K13 | core | high | explicit_landing_page | … דף נחיתה לקמפיין | ✓ | ✓ | 5→5 | **2**/0/0 | 0 / 0 | Some ad/SEO unclass | **H** | **KEEP (core)** |
| K14 | rot | med | site_problem | … שידרוג WordPress | ✓ | ✓ | 5→3 | 0/0/2 | 1 / 2 | WP vendor content | M | REWRITE |
| K15 | rot | med | site_problem | … מומחה UX … | ✓ | ✓ | 5→5 | 0/0/2 | 2 / 2 | Careers (R1/R2) | **H** | REWRITE |
| R01 | rot | med | explicit_website | מחפשת … אתר לעסק | ✓ | ✓ | 5→0 | — | 1 / 0 | Deduped only | L | KEEP |
| R02 | rot | med | explicit_recommendation | מחפשת המלצה … | ✓ | ✓ | 5→0 | — | 0 / 0 | Deduped only | L | KEEP |
| R03 | rot | med | explicit_website | מחפש מישהו שיבנה לי אתר | ✓ | ✓ | 5→2 | 0/0/2 | 1 / 1 | Broad duplicate K01 | M | ROTATE_LOWER priority |
| R04 | rot | med | explicit_recommendation | מישהו מכיר בונה … | ✓ | ✓ | 5→2 | 0/0/2 | 3 / 1 | Wikipedia, noise | M | KEEP |
| R05 | rot | med | explicit_website | מחפש מפתח אתרים לפרויקט | ✓ | ✓ | 5→2 | **1**/0/1 | 0 / 2 | Some irrelevant | **H** | **KEEP → promote core** |
| R06 | rot | med | explicit_ecommerce | … אתר מכירות אונליין | ✓ | ✓ | 5→3 | **1**/0/1 | 1 / 1 | Mixed | **H** | **KEEP → promote core** |
| R07 | rot | med | explicit_ecommerce | צריך חנות אונליין … | ✓ | ✓ | 5→2 | 0/0/2 | 3 / 1 | ISP/telecom (R2) | M | REWRITE |
| R08 | rot | med | site_problem | מחפש לשדרג את האתר | ✓ | ✓ | 5→3 | 0/0/2 | 0 / 0 | Careers (R1/R2 gate) | H | REWRITE |
| R09 | rot | med | site_problem | … יעצב מחדש אתר | ✓ | ✓ | 5→5 | 0/0/2 | 0 / 0 | US gov/corp (R1); R2 all locale reject | **H** | REWRITE |
| R10 | rot | med | site_problem | … לא מותאם לסלולר … | ✓ | ✓ | 5→4 | 0/0/2 | 1 / 1 | Careers, legal | H | REWRITE |
| R11 | rot | med | explicit_landing_page | מחפש בונה דפי נחיתה … | — | — | — | — | — | — | **ND** | KEEP |
| R12 | rot | med | explicit_landing_page | מחפשת … דף נחיתה | — | — | — | — | — | — | ND | KEEP |
| R13 | rot | med | explicit_ecommerce | … לבניית חנות Shopify | — | — | — | — | — | — | ND | KEEP |
| R14 | rot | med | explicit_recommendation | … חברה לבניית אתרים | — | — | — | — | — | — | ND | KEEP |
| R15 | rot | med | explicit_website | … אתר רספונסיבי | — | — | — | — | — | “Responsive” SEO risk | M | REWRITE |
| R16 | rot | med | explicit_website | צריכה … אתר לעסק | — | — | — | — | — | — | ND | KEEP |
| R17 | rot | med | specific_need | … אתר לסטארטאפ | — | — | — | — | — | — | ND | KEEP |
| R18 | rot | med | explicit_website | … בונה … SEO | — | — | — | — | — | SEO seller intent | M | ROTATE_LOWER / REWRITE |
| R19 | rot | med | site_problem | … תחזוקת אתר | — | — | — | — | — | Maintenance ≠ new build | M | REWRITE |
| R20 | rot | med | explicit_website | מחפש מעצב אתרים … | — | — | — | — | — | — | ND | KEEP |
| R21 | rot | med | site_problem | … אתר … שבור | — | — | — | — | — | Break/fix buyer? | L | KEEP |
| R22 | rot | med | research | … ייעוץ פלטפורמה לחנות | ✓ | ✓ | 5→3 | 0/0/2 | 0 / 1 | Tourism/gov (R1) | H | REWRITE + EXPERIMENTAL |
| X01 | exp | expl | research | כמה עולה לבנות אתר | ✓ | ✓ | 5→0 | — | 0 / 0 | Deduped | L | EXPERIMENTAL |
| X02 | exp | expl | research | אתר או אינסטגרם | ✓ | ✓ | 5→3 | 0/0/2 | 1 / 1 | App stores | H | REWRITE or DISABLE |
| X03 | exp | expl | possible_need | פתחתי עסק … צריך אתר | — | — | — | — | — | — | ND | EXPERIMENTAL |
| X04 | exp | expl | possible_need | עסק מקומי בלי אתר | — | — | — | — | — | — | ND | EXPERIMENTAL |
| X05 | exp | expl | research | איך בוחרים בונה … | — | — | — | — | — | Guide content | M | EXPERIMENTAL |
| X06 | exp | expl | research | הבדל דף נחיתה / תדמית | — | — | — | — | — | Pure education | H | DISABLE |
| X07 | exp | expl | research | חוות דעת על בונה | — | — | — | — | — | Reviews ≠ post | M | EXPERIMENTAL |
| X08 | exp | expl | research | Wix או בונה מקצועי | — | — | — | — | — | DIY compare | H | DISABLE |
| X09 | exp | expl | research | רעיונות לעיצוב … לפני בונה | ✓ | ✓ | 5→5 | 0/0/2 | 2 / 3 | Vendor inspiration | H | REWRITE or DISABLE |

**ND** = needs data (not in either day’s 29).

---

## 4. Current query weaknesses

1. **Concept / problem statements** without a clear **human asking for help** (K15 UX, R10 mobile, R08 upgrade, K12 mobile fix).
2. **Redesign / upgrade** wording that matches **agency landing pages and careers** (K06, R09, R08).
3. **Research / education** queries that match **guides, Wikipedia, app stores** (X02, X05–X09, R22).
4. **Technical or role keywords** that attract **SEO posts** (R18 SEO, K14 WordPress upgrade, R15 responsive).
5. **Duplicate buyer shapes** burning credits (K01 vs R03, K02 vs R13, K05 vs R11/R12).
6. **No channel hint** toward **Facebook/forum posts** where Israeli buyers actually write.

---

## 5. Buyer-language taxonomy (proposed)

**High-intent families** (prioritize in core daily set):

| Pattern | Example stems | Run evidence |
|---------|---------------|--------------|
| **A. Direct seek + build** | מחפש(ת) מישהו שיבנה לי … | K01,K05; weak SERP but correct intent |
| **B. Role + business** | מחפש בונה/מפתח אתרים לעסק … | **K08, R05** explicitNeed |
| **C. Need + deliverable** | צריך אתר / חנות / דף נחיתה … | K07, **K13**, **R06** |
| **D. Recommendation seek** | המלצה / מי ממליץ / מישהו מכיר … | K03, K10, R04 — noisy but on-target |
| **E. Quote / hire** | הצעת מחיר … | K04 — moderate noise |
| **F. New business moment** | עסק חדש … צריך/מחפש … | K10, X03 (untested) for possibleNeed |

**Lower-intent / avoid as daily core:**

| Pattern | Why |
|---------|-----|
| Expertise label without “מחפש” | K15 מומחה UX → careers |
| Pure problem description | R10 mobile, K12 mobile |
| Upgrade/redesign alone | R08, R09 without “מישהו ש…” |
| Platform/research | R22, X02, X06, X08, X09 |
| Maintenance / fix-only | R19, R21 (unless rewritten to hire someone) |

---

## 6. Recommendations by action (all 46)

| Action | Count | IDs |
|--------|------:|-----|
| **KEEP** | **24** | K01–K05, K07–K11, K13, R01–R04, R05, R06, R11–R14, R16–R17, R20–R21 |
| **REWRITE** | **14** | K06, K09, K12, K14, K15, R07, R08, R09, R10, R15, R18, R19, R22, X02, X09 (+ optional X05) |
| **ROTATE_LOWER** (demote core → rotating) | **3** | K06, K09, K12 |
| **Promote → core** (tier move up) | **2** | R05, R06 |
| **EXPERIMENTAL** (keep tier, do not daily core) | **6** | X01, X03, X04, X05, X07 + rewritten R22 variant |
| **DISABLE** (recommended `enabled: false`) | **3** | X06, X08, X09 (or rewrite X09 once then re-enable) |

*Note: REWRITE and tier moves overlap; implementation should apply rewrite text first, then tier.*

### Sample REWRITE proposals (natural Hebrew, not keyword spam)

| ID | Current | Proposed | Rationale |
|----|---------|----------|-----------|
| K06 | … מיושן … יעצב מחדש | **מחפשים מישהו שיעצב מחדש אתר לעסק קטן** | Drops “מיושן” tourism match; keeps redesign buyer |
| K12 | … לא נראה טוב במובייל … | **מחפשים בונה אתרים שיתקן אתר שלא עובד טוב בנייד לעסק** | Less “mobile UX SEO”; explicit hire |
| K15 | מומחה UX … | **מחפשים מישהו לשיפור אתר עסקי (חוויית משתמש)** | Removes “מומחה” careers magnet |
| R08 | מחפש לשדרג את האתר | **מחפש מישהו שישדרג לי את האתר של העסק** | Help-seeking, not vendor “upgrade services” |
| R09 | … יעצב מחדש אתר | **מחפש מישהו שיעצב מחדש אתר לעסק קטן בישראל** | Stronger local buyer frame (test, don’t guarantee SERP) |
| R10 | … לא מותאם לסלולר … | **מחפשים מישהו שיתקן אתר שלא נראה טוב בנייד לעסק** | Same as K12 pattern |
| R22 | ייעוץ לבחירת פלטפורמה | **מחפש המלצה על בונה/פלטפורמה לחנות אונליין לעסק קטן** | Buyer recommendation not abstract consulting |
| X02 | אתר או אינסטגרם | **האם כדאי לי כבעל עסק לבנות אתר או להסתפק באינסטגרם** | First-person; still experimental tier |
| X09 | רעיונות לעיצוב … | **לפני שמזמינים בונה אתר — מחפשים המלצות/דוגמאות לעסק קטן** | Closer to pre-buy discussion (still weak) |

---

## 7. Proposed revised core set (8–10 daily)

**Target 9 core** (quality-first):

1. K01 — מחפש מישהו שיבנה לי אתר לעסק  
2. K03 — מחפש המלצה על בונה אתרים לעסק  
3. K05 — מחפש מישהו שיבנה לי דף נחיתה לעסק  
4. K07 — צריך מישהו שיבנה לי חנות אינטרנטית לעסק  
5. **K08** — מחפש בונה אתרים לעסק קטן *(proven explicitNeed)*  
6. **K13** — מחפש מישהו שיבנה דף נחיתה לקמפיין *(proven)*  
7. **R05** — מחפש מפתח אתרים לפרויקט של עסק *(promote)*  
8. **R06** — מחפש מישהו שיבנה אתר מכירות אונליין *(promote)*  
9. K04 **or** K10 — quote vs new-business recommendation (pick one after A/B)

**Demote from core to rotating:** K02, K06, K09, K11, K12, K10/K04 (the one not chosen).

---

## 8. Proposed rotating set

- Keep **~22** enabled rotating pool; daily pick **5–7** (not 13).
- Prioritize untested but strong buyer clones: R11, R12, R13, R16, R20, R21.
- Hold rewritten problem queries (K14, K15, R08–R10, R15) in rotating **after** rewrite.
- Reduce near-duplicates in same day (avoid K01+R03 together).

---

## 9. Proposed experimental set

- **2 slots/day max:** X03, X04 (possible_need), X01 (price), X07 (reviews).
- **Disable:** X06, X08; pause X09 until rewritten.
- **Social variants (new profiles, next revision):** 2–3 duplicates of K01/K08 with `site:facebook.com` or `site:instagram.com` prefix — **experimental only**.

---

## 10. Recommended daily Tavily budget

| | Current | Recommended V1 |
|--|--------:|---------------:|
| Core | 13 | **8–9** |
| Rotating | 13 | **5–7** |
| Experimental | 3 | **1–2** |
| **Total/day** | **29** | **14–18** |
| **Monthly (30d)** | ~870 | **~420–540** |

Quality-first: **~15 requests/day** midpoint leaves headroom under ~1000 credits for re-tests and failures.

---

## 11. Platform / social search assessment

**Observation:** Best explicitNeed signals in Run 1 included **Instagram** URLs—but as **classified buyer-ish posts**, mixed with noise. Generic web search still returns **corporate** pages first.

**Tavily (our integration):**

- Supports `include_domains` / `exclude_domains` on the request body.
- **`site:facebook.com` in query string** is a reasonable experiment (Tavily often honors search operators; not guaranteed—must measure).
- Limits: login-walled groups, fragmented snippets, `include_raw_content: false`, English UI shells, **low recall** for closed groups.

**Recommendation:** Worth **2–3 experimental profile variants** (duplicate IDs with `-FB`/`-IG` suffix in next catalog revision), **not** replacing the whole catalog. Compare actionable rate vs generic K01/K08.

**Do not assume** social site: alone fixes quality—queries must still be **help-seeking Hebrew**.

---

## 12. Next controlled test design

**Do not repeat** same-day 29-query blast.

| Parameter | Recommendation |
|-----------|----------------|
| **When** | **Next Israel calendar day** (fresh rotation + different Tavily freshness) **and** after catalog revision vNext |
| **Queries** | **14–16** total: 9 core + 5 rotating + 2 experimental (incl. 1–2 social variants) |
| **Hypothesis** | Stronger buyer-language + smaller set ↑ actionable per request |
| **Primary metrics** | explicitNeed + possibleNeed per run; **actionable / Tavily request**; **actionable / classified**; irrelevant rate among classified; quality-gate reject rate |
| **Secondary** | rediscovery rate (expect lower on clean corpus); raw volume (explicitly **not** success) |
| **Success bar (directional)** | ≥2 actionable persists with ≤18 requests, zero unsafe, irrelevant &lt;70% of classified |
| **Failure bar** | 0 actionable after 2 consecutive test days → platform variants + classifier/prompt review (out of scope here) |

---

## 13. Confidence tiers

| Tier | Topics |
|------|--------|
| **HIGH** | Demote K12/K06/K15/R09/R10/R22/X02 from daily core; promote K08/K13/R05/R06; reduce daily budget; disable X06/X08; generic web ≠ buyer posts |
| **MEDIUM** | Exact rewrite strings; R15/R18/R19; 9 vs 10 core count; social `site:` variants |
| **NEEDS MORE DATA** | R11–R21, X03–X07; feminine variants R01/R02; possibleNeed potential; optimal rotating window size |

---

## 14. Next catalog revision — implementation scope (no code here)

1. Edit `search-profiles.he.v2.prod.json`: rewrites, tier changes, `enabled` flags (X06, X08, X09 off).
2. Update `DEFAULT_V2_DAILY_SELECTION_TARGETS` to `{ core: 9, rotating: 6, experimental: 2 }` (or 8/6/2).
3. Add 2–3 **experimental** social duplicate profiles (new IDs).
4. Rebuild catalog artifact if using build script; extend validator for new IDs.
5. Update docs only; **no** pipeline/classifier changes in same PR.
6. Run **one** paid test day; audit before scaling toward 29 again.

---

## Appendix: Query intent review (participated profiles)

All participated queries were scored against “real person seeking help to build/improve a business site.” **Strong buyer shape:** K01–K05, K07–K11, K13, R03–R07, R01–R02. **Too broad/conceptual:** K06, K12, K15, R08–R10, R22, X02, X09. **Mixed:** K09, K14, X01.

---

*End of audit — recommendations only; no catalog or code modified in this phase.*

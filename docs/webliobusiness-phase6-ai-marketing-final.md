# Weblio Business — Phase 6: AI Marketing (Final)

**Status:** Phase 6E complete — internal admin content workspace  
**Route:** `/admin/business/ai-marketing`  
**Prerequisite audits:** [webliobusiness-phase6-ai-marketing-audit.md](./webliobusiness-phase6-ai-marketing-audit.md), [webliobusiness-phase6c1-content-architecture-audit.md](./webliobusiness-phase6c1-content-architecture-audit.md)

---

## Seven hub tools

| Tool (Hebrew) | Purpose | Sources |
|---------------|---------|---------|
| תוכן לאתר | `websiteProjectContent` | `project` only |
| פוסט לרשתות | `socialPost` | `project`, `freeTopic` |
| פוסט LinkedIn | `linkedinPost` | `project`, `freeTopic` |
| סטורי | `story` | `project`, `freeTopic` |
| רעיונות לתוכן | `contentIdeas` | `globalWeblio`, `project` |
| שיפור טקסט | `rewrite` | `sourceText` |
| כתיבה חופשית | `freeform` | `freeTopic` |

Hub concept: **«מה תרצה ליצור?»** — client-side tool selection, single route.

---

## Purpose / source matrix (server authority)

Illegal combinations are rejected by Zod (`marketingGenerationInputSchema`).

- **websiteProjectContent:** `project` + `projectId`
- **socialPost / linkedinPost / story:** `project` + `projectId` OR `freeTopic` + required `userInstruction`
- **contentIdeas:** `globalWeblio` OR `project` + `projectId`
- **rewrite:** `sourceText` + `sourceText` body + `transformation`
- **freeform:** `freeTopic` + required `userInstruction`

---

## Website Content Apply

**Generate (read-only):** `generateMarketingDraftAction` → structured JSON fields + suggested `technologies`.

**Apply (write):** `applyAiMarketingWebsiteContentAction` → `updateProjectWebsiteContentFields` → `Project.updateOne` with narrow `$set` / `$unset`.

**Writable Project fields (only):**

- `title`
- `subtitle`
- `description`
- `homeTitle`
- `homeSubtitle`
- `technologies`

**Not writable via AI Marketing:** images, URLs, publish flags, orders, CTA, etc.

Admin flow: generate → edit locally → **החל תוכן בפרויקט** → confirmation modal → apply.

Revalidation: `/`, `/projects`, `/admin/projects` via `revalidateProjectPaths()`.

---

## Technologies behavior

- Mongo field: `technologies: string[]` (max **20** tags, **40** chars each — aligned with project admin form).
- AI may **suggest** tags in website structured output; suggestions must be grounded in project context.
- Admin edits comma-separated list in UI (raw string while typing; commit on blur / apply).
- Only **explicit Apply** persists tags to Project.

---

## Brand Context

- Static module: `src/lib/business/ai-marketing/brand-context.ts`
- Version: **`weblio-brand-v4`**
- First-person singular Weblio/Omer voice, anti-cliché list, CTA preferences.
- **Personal voice ≠ invented biography** (explicit in brand + prompts).

---

## Personal-claim safety (Phase 6E)

Global prompt rules distinguish:

- **Allowed:** tone, structure, general professional explanations, topic-based opinion when user requested it.
- **Forbidden unless explicitly in user/project/brand data:** invented lessons, client quotes, business journey, “returning to posting”, metrics, timelines, personal anecdotes.

Free-topic mode supports **topic discovery** (“אין לי רעיון…”) — model picks one professional direction without fabricating a personal story.

---

## No-long-dash rule

- Model instructed: never output em dash (U+2014) or en dash (U+2013); use ASCII hyphen `-`.
- Runtime safeguard: `normalize-marketing-copy.ts` on all generator outputs (`content`, `ideas`, website fields, tags).

---

## OpenAI architecture (isolated from Intent Monitor)

| Concern | Implementation |
|---------|----------------|
| Client | `openai-marketing-client.ts` (separate cache) |
| Env | `OPENAI_MARKETING_ENABLED`, `OPENAI_MARKETING_MODEL`, `OPENAI_MARKETING_TIMEOUT_MS`, `OPENAI_MARKETING_MAX_OUTPUT_TOKENS` |
| Shared key name | `OPENAI_API_KEY` (same key variable as Intent; **separate feature flag and code path**) |
| API | OpenAI Responses API + strict JSON schemas |
| Default model | `gpt-5.4-mini` (marketing default in code/env example) |

**Intent Monitor** (`src/lib/discovery/classifier/*`) is not modified by AI Marketing.

---

## Security boundaries

- `requireAdmin()` on all server actions
- Server-side Zod validation
- Sanitized Hebrew errors (no stack traces / provider bodies in UI)
- No prompt body logging
- User/project blocks delimited as **data**, not system instructions
- Generation is read-only except Website Apply allowlist

---

## Persistence

| Persisted | Not persisted |
|-----------|----------------|
| Website Apply → existing `projects` collection | AI Marketing drafts/history |
| | Mongo collection for marketing |
| | Auto-publish / scheduling / social APIs |

All other tools: **Generate → Edit → Copy** (client state only).

---

## Testing coverage (automated)

Under `tests/business/ai-marketing/`:

- Validations (purpose/source matrix)
- Prompt builder (accuracy, purpose blocks, personal-claim rules)
- Generator mocks (structured output, dash normalization)
- Website apply allowlist
- Technologies parsing
- Hub/shell wiring
- Input builders per tool

Run: `npm run test:business`

---

## Known V1 limitations

- No draft history or cross-session restore
- No automatic publishing or channel integrations
- No URL fetching / site crawling for project context
- Website technologies suggestions depend on project context quality (thin-project notice only)
- Single draft per request (no multi-variant generation)
- Hebrew-primary; no full i18n UI

---

## Intentionally deferred (post–Phase 6)

- Autonomous agents / background generation
- Usage analytics dashboard for marketing
- Nested routes or saved templates
- Multi-slide Story JSON
- Public or unauthenticated marketing API

---

*End of Phase 6 AI Marketing final documentation.*

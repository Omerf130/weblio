# CP12A — Landing Page CMS (`/build-your-dream`)

Dedicated singleton admin CMS for the main Weblio campaign landing page only. Not a Landing Builder.

## Architecture

```
Admin editor (/admin/landing-page)
  → saveBuildYourDreamLandingAction (requireAdmin)
  → MongoDB singleton (build_your_dream_landing) + Vercel Blob (landing/*)
  → getBuildYourDreamContent()
  → /build-your-dream UI (unchanged layout/components)
```

| Layer | Behavior |
|-------|----------|
| **Before first Save** | Static content from `STATIC_BUILD_YOUR_DREAM_CONTENT` |
| **After first Save** | MongoDB singleton (`singletonKey: "build-your-dream"`) |
| **Fallback** | If MongoDB unavailable, static content is used (tests + dev without DB) |
| **Preview** | Opens `/build-your-dream` in a new tab (no iframe/live preview) |
| **Images** | Hero, Split 1, Split 2, OG — uploaded to Vercel Blob; old keys deleted on replace/remove |

## Files created

| File | Purpose |
|------|---------|
| `src/models/BuildYourDreamLanding.ts` | Singleton MongoDB model |
| `src/lib/data/build-your-dream-landing.ts` | DB ↔ content mapping, admin state loader, upsert |
| `src/lib/validations/build-your-dream-landing.ts` | Zod schema, merge/preserve/normalize helpers |
| `src/lib/storage/landing-images.ts` | Vercel Blob wrapper (`landing/` prefix) |
| `src/lib/build-your-dream-landing/actions.ts` | `saveBuildYourDreamLandingAction` |
| `src/lib/leads/action-states.ts` | Client-safe action state types (Vite) |
| `src/app/admin/(protected)/landing-page/page.page.tsx` | Admin route |
| `src/components/admin/landing-page/LandingPageEditor.tsx` | Accordion CMS editor |
| `src/components/admin/landing-page/LandingPageEditor.module.scss` | Editor styles |
| `src/components/admin/landing-page/LandingPageImageField.tsx` | Image upload/preview/remove |
| `tests/build-your-dream/landing-cms.test.ts` | Validation + blob helper tests |

## Files modified

| File | Change |
|------|--------|
| `src/lib/content/build-your-dream/types.ts` | Added `ogImage?`, `storageKey?` on images |
| `src/lib/content/build-your-dream/get-build-your-dream-content.ts` | MongoDB with static fallback |
| `src/lib/admin/nav-config.ts` | Added "דף נחיתה" nav item |
| `src/pages/build-your-dream/BuildYourDreamPage.tsx` | OG meta tags via `useEffect` |
| `src/lib/leads/actions.ts` | Re-exports action state types |
| `package.json` | Added `test:landing-cms` script |
| `tsconfig.app.json` | Path aliases + granular lib excludes for Vite |
| `vite.config.ts` | `@/` alias for Vite build |

## CMS capabilities

- **Sections:** SEO, Hero, Benefits, Split 1, Process, CTA Banner, Split 2, FAQ, Lead Form, Final CTA, Thank You
- **Sticky sidebar** for jump-to-section navigation
- **Sticky save bar** with Preview + Save
- **Last saved** timestamp (`updatedAt`) or "טרם נשמר"
- **Unsaved changes** warning (`beforeunload`)
- **Success toast** on save
- **Reorderable lists:** benefits, FAQ, process steps, thank-you next steps, qualification questions
- **Lead form field labels** preserved (not editable in CMS)
- **CTA actions** enforced (`scroll-to-form` on marketing CTAs)
- **Image uploads:** Hero, Split 1, Split 2, OG image

## Blob integration

- Prefix: `landing/`
- Upload on save when new file selected
- Replace: deletes previous `storageKey` from Blob
- Remove: clears image from content + deletes Blob object
- Static placeholder URLs used until first upload

## Verification

| Command | Status |
|---------|--------|
| `npm run build:next` | Pass |
| `npm run build:vite` | Pass |
| `npm run lint` | Pass (pre-existing warnings only) |
| `npm run test:landing-cms` | Pass (6/6) |
| `npm run test:leads` | Pass (23/23) |

## Manual verification checklist

- [ ] Log in to admin → sidebar shows **"דף נחיתה"** → opens `/admin/landing-page` directly
- [ ] Before first save: editor loads static content; status shows **"טרם נשמר"**
- [ ] Edit a text field (e.g. hero title) → dirty indicator appears
- [ ] Click **Preview** → `/build-your-dream` opens in new tab
- [ ] Click **Save** → success toast; last-saved timestamp updates
- [ ] Reload admin editor → saved content persists
- [ ] Visit `/build-your-dream` → saved content reflects on public page
- [ ] Upload hero image → save → image appears on landing page
- [ ] Replace hero image → save → old blob removed, new image shown
- [ ] Remove OG image → save → OG meta tag removed from page source
- [ ] Lead form still submits correctly
- [ ] Thank-you flow + qualification still works
- [ ] Try navigating away with unsaved edits → browser warns

## Out of scope (CP12A)

- Landing Builder / multi-page CMS
- Seed script
- Live/iframe preview
- Layout or routing changes to `/build-your-dream`
- Lead capture or thank-you logic changes

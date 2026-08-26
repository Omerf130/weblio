# Landing Page Polish — Audit

**Page:** `/build-your-dream`  
**Date:** 2026-08-26  
**Scope:** UI/UX only — no copy, backend, routing, or thank-you flow changes.

---

## Summary

The landing page was polished for paid-ad conversion: stronger contrast, clearer CTA hierarchy, distinct section backgrounds, premium placeholder frames, and tighter mobile rhythm — while keeping performance-first CSS and removing distracting animated hero blobs.

---

## Improvements by issue

| # | Issue | What changed |
|---|--------|--------------|
| 1 | White headings on bright backgrounds | Dark `--landing-ink` on all light sections; darker banner gradient; explicit heading colors in every section SCSS |
| 2 | Repetitive sections | New variants: `cream`, `champagne`, `glow`; varied density (`tight` / `loose`); distinct card/timeline/accordion treatments |
| 3 | Weak hero | Larger display type, pill eyebrow badge, stronger primary vs outline secondary CTAs, premium hero image frame; **removed infinite blob animations** |
| 4 | Generic placeholders | Gradient mat frames (`hero`, `editorial`, `tilted`), aspect-ratio images, inner border ring on hero frame |
| 5 | Excessive whitespace | Section-specific padding tokens; tighter FAQ/banner/final CTA; reduced mobile vertical gaps |
| 6 | CTAs don't stand out | Primary: larger shadow + gradient; secondary: transparent outline; banner uses high-contrast white `onBanner` button |
| 7 | Subtle/wrong motion | Removed animated backgrounds; kept scroll reveals + CSS hover lift on cards/buttons |
| 8 | Flat section transitions | Alternating warm/cream/champagne/glow/accent/banner backgrounds; soft gradient overlay on default sections |
| 9 | Generic cards | Stronger shadows, hover elevation, gradient icon wells, featured first benefit card accent |
| 10 | Weak typography | `--landing-display`, `--landing-h2`, `--landing-lead`, `--landing-body` scale; darker muted text for readability |

---

## Files changed

### New
- `src/pages/build-your-dream/landing-shared.scss`
- `docs/landing-polish/` (screenshots + this audit)
- `scripts/capture-landing-screenshots.mjs` (dev tooling only)

### Updated
- `landing-theme.scss` — expanded design tokens
- `BuildYourDreamPage.tsx` — imports shared styles; split section variants
- `BuildYourDreamPage.module.scss`
- `LandingSection.tsx` / `.module.scss` — new variants + density
- `LandingHero.tsx` / `.module.scss` — static hero, no motion blobs
- `LandingBenefits.module.scss`
- `LandingSplit.tsx` / `.module.scss` — accent line, frame variants
- `LandingProcess.module.scss` — timeline-style steps
- `LandingCtaBanner.tsx` / `.module.scss` — `onBanner` CTA
- `LandingFaq.module.scss`
- `LandingLeadForm.module.scss`
- `LandingFinalCta.tsx` / `.module.scss`
- `LandingButton.tsx` / `.module.scss` — `onBanner` variant, CSS hover
- `LandingImageFrame.tsx` / `.module.scss`
- `LandingImage.module.scss`
- `LandingLogo.module.scss`

### Untouched (as required)
- `src/lib/content/**` (copy + provider structure)
- `src/lib/leads/**`, `src/app/**` routes/actions
- `ThankYouPage*` — no changes
- Admin, MongoDB, validation

---

## Screenshots

Saved in `docs/landing-polish/`:

**Desktop (1440px)**
- `desktop-full-page.png`
- `desktop-hero.png` … `desktop-final-cta.png` (all 9 sections)

**Mobile (390px)**
- `mobile-full-page.png`
- `mobile-hero.png` … `mobile-final-cta.png` (all 9 sections)

---

## Contrast notes

| Section | Background | Heading color | Status |
|---------|-------------|---------------|--------|
| Hero | Warm white + static radial | `--landing-ink` | OK |
| Benefits | Warm peach | `--landing-ink` | OK |
| Split Primary | Default + soft gradient | `--landing-ink` | OK |
| Process | Accent gradient | `--landing-ink` | OK |
| CTA Banner | Dark orange gradient | White + text-shadow | OK |
| Split Secondary | Cream | `--landing-ink` | OK |
| FAQ | Default | `--landing-ink` | OK |
| Lead Form | Glow radial | `--landing-ink` | OK |
| Final CTA | Champagne | `--landing-ink` | OK |

---

## Conversion checklist

- [x] No copy changed; content provider untouched
- [x] Still exactly 9 sections, same order
- [x] All headings readable on their background
- [x] Primary CTA dominates in hero and every section
- [x] Form reachable within ~1 short scroll from any CTA
- [x] Placeholders only — frames improved, no new images
- [x] Trustworthy premium feel (no Dribbble gimmicks)
- [x] Form logic/actions unchanged; thank-you flow untouched

## Performance checklist

- [x] Removed animated hero blobs / backgrounds
- [x] No parallax, particles, or heavy blur
- [x] No new React state for visuals
- [x] No unnecessary DOM components (CSS pseudo-elements preferred)
- [x] `npm run build:next` passes
- [x] Animations: scroll reveal + CSS hover only

---

## Manual verification checklist

```
[ ] Open http://localhost:3000/build-your-dream on desktop
[ ] Hero: primary CTA obvious, secondary clearly lighter
[ ] Scroll full page — each section feels distinct but cohesive
[ ] No invisible/low-contrast headings
[ ] Click CTAs — all scroll to #lead-form
[ ] Submit lead form — redirects to thank-you (unchanged flow)
[ ] Test on mobile (390px): full-width CTAs, readable text, tappable FAQ
[ ] Confirm page feels fast (no janky animations)
```

---

**STOP — awaiting manual approval before CMS or next checkpoint.**

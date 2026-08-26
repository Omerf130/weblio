import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.LANDING_URL ?? "http://localhost:3003/build-your-dream";
const OUT = path.join(process.cwd(), "docs", "landing-polish");

const SECTIONS = [
  { id: "hero", selector: "section[aria-labelledby='landing-hero-title']" },
  { id: "benefits", selector: "section[aria-labelledby='landing-benefits-title']" },
  { id: "split-primary", selector: "section[aria-labelledby='landing-split-split-primary']" },
  { id: "process", selector: "section[aria-labelledby='landing-process-title']" },
  { id: "cta-banner", selector: "section[aria-labelledby='landing-cta-banner-title']" },
  { id: "split-secondary", selector: "section[aria-labelledby='landing-split-split-secondary']" },
  { id: "faq", selector: "section[aria-labelledby='landing-faq-title']" },
  { id: "lead-form", selector: "#lead-form" },
  { id: "final-cta", selector: "section[aria-labelledby='landing-final-cta-title']" },
];

async function capture(viewport, label) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport });
  await page.goto(BASE, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(1200);

  await page.screenshot({
    path: path.join(OUT, `${label}-full-page.png`),
    fullPage: true,
  });

  for (const section of SECTIONS) {
    const el = page.locator(section.selector).first();
    if ((await el.count()) > 0) {
      await el.screenshot({
        path: path.join(OUT, `${label}-${section.id}.png`),
      });
    }
  }

  await browser.close();
}

await mkdir(OUT, { recursive: true });
await capture({ width: 1440, height: 900 }, "desktop");
await capture({ width: 390, height: 844 }, "mobile");
console.log("Screenshots saved to", OUT);

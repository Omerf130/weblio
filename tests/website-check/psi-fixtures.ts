import type { PsiPageSpeedResponse } from "../../src/lib/website-check/psi/pagespeed-response-types";

export const PSI_FIXTURE_COMPLETE: PsiPageSpeedResponse = {
  analysisUTCTimestamp: "2026-03-20T10:00:00.000Z",
  loadingExperience: {
    metrics: {
      LARGEST_CONTENTFUL_PAINT_MS: { percentile: 2100, category: "AVERAGE" },
      CUMULATIVE_LAYOUT_SHIFT_SCORE: { percentile: 8, category: "FAST" },
    },
    overall_category: "AVERAGE",
  },
  lighthouseResult: {
    lighthouseVersion: "12.0.0",
    finalUrl: "https://example.com/",
    fetchTime: "2026-03-20T10:00:01.000Z",
    categories: {
      performance: {
        id: "performance",
        score: 0.92,
        auditRefs: [
          { id: "largest-contentful-paint", weight: 25 },
          { id: "render-blocking-resources", weight: 10 },
        ],
      },
      seo: {
        id: "seo",
        score: 0.88,
        auditRefs: [{ id: "document-title", weight: 1 }],
      },
      accessibility: {
        id: "accessibility",
        score: 0.85,
        auditRefs: [{ id: "color-contrast", weight: 3 }],
      },
      "best-practices": {
        id: "best-practices",
        score: 0.9,
        auditRefs: [{ id: "uses-https", weight: 1 }],
      },
    },
    audits: {
      "largest-contentful-paint": {
        id: "largest-contentful-paint",
        title: "Largest Contentful Paint",
        description: "Lab LCP metric.",
        score: 0.8,
        scoreDisplayMode: "numeric",
        displayValue: "2.1 s",
        numericValue: 2100,
      },
      "render-blocking-resources": {
        id: "render-blocking-resources",
        title: "Eliminate render-blocking resources",
        description: "Resources block the first paint.",
        score: 0.4,
        scoreDisplayMode: "metric",
        displayValue: "Potential savings of 450 ms",
        details: { type: "opportunity", overallSavingsMs: 450 },
      },
      "document-title": {
        id: "document-title",
        title: "Document has a title element",
        description: "Titles are important for SEO.",
        score: 1,
        scoreDisplayMode: "binary",
      },
      "color-contrast": {
        id: "color-contrast",
        title: "Background and foreground colors have sufficient contrast ratio",
        description: "Low-contrast text is hard to read.",
        score: 0,
        scoreDisplayMode: "binary",
      },
      "uses-https": {
        id: "uses-https",
        title: "Uses HTTPS",
        description: "All resources should be served over HTTPS.",
        score: 1,
        scoreDisplayMode: "binary",
      },
      "first-contentful-paint": {
        id: "first-contentful-paint",
        title: "First Contentful Paint",
        score: 0.95,
        scoreDisplayMode: "numeric",
        displayValue: "1.0 s",
        numericValue: 1000,
      },
      "cumulative-layout-shift": {
        id: "cumulative-layout-shift",
        title: "Cumulative Layout Shift",
        score: 0.99,
        scoreDisplayMode: "numeric",
        displayValue: "0.01",
        numericValue: 0.01,
      },
    },
  },
};

export const PSI_FIXTURE_MISSING_CATEGORIES: PsiPageSpeedResponse = {
  lighthouseResult: {
    lighthouseVersion: "12.0.0",
    categories: {
      performance: { id: "performance", score: 0.7, auditRefs: [] },
    },
    audits: {},
  },
};

export const PSI_FIXTURE_NO_FIELD_DATA: PsiPageSpeedResponse = {
  lighthouseResult: {
    lighthouseVersion: "12.0.0",
    categories: {
      performance: { id: "performance", score: 0.75, auditRefs: [] },
      seo: { id: "seo", score: 0.8, auditRefs: [] },
      accessibility: { id: "accessibility", score: 0.82, auditRefs: [] },
      "best-practices": { id: "best-practices", score: 0.9, auditRefs: [] },
    },
    audits: {},
  },
};

export const PSI_FIXTURE_RUNTIME_ERROR: PsiPageSpeedResponse = {
  lighthouseResult: {
    lighthouseVersion: "12.0.0",
    runtimeError: { code: "NO_FCP", message: "The page did not paint." },
    categories: {
      performance: { id: "performance", score: null, auditRefs: [] },
    },
    audits: {},
  },
};

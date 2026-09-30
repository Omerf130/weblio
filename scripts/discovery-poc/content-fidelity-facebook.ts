/**
 * PoC: compare Tavily Search content vs include_raw_content vs Extract
 * for one Facebook group post URL from a known Intent (read-only).
 * Does not touch production discovery, Mongo writes, or OpenAI.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { connectDB } from "@/lib/db/mongoose";
import { getIntentById } from "@/lib/data/intents";
import { getTavilyApiKey, TAVILY_SEARCH_API_URL } from "@/lib/discovery/providers/tavily-env";
import { getProductionDiscoveryPolicy } from "@/lib/discovery/discovery-policy";
import mongoose from "mongoose";

const TARGET_INTENT_ID = "6abcf66b39bbb26919ee5588";
const TAVILY_EXTRACT_API_URL = "https://api.tavily.com/extract";

type NoiseReport = {
  charCount: number;
  buyerPhrase: boolean;
  otherPosts: boolean;
  reactNative: boolean;
  sellerOrOtherPost: boolean;
  facebookBoilerplate: boolean;
  excerptRedacted: string;
};

function redact(text: string, max = 220): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  const redacted = trimmed
    .replace(/\d{9,}/g, "[PHONE]")
    .replace(/050[\d-]{7,}/g, "[PHONE]");
  return redacted.length <= max ? redacted : `${redacted.slice(0, max)}…`;
}

function analyzeContent(text: string | undefined): NoiseReport {
  const body = text?.trim() ?? "";
  const lower = body.toLowerCase();
  return {
    charCount: body.length,
    buyerPhrase: body.includes("מחפש בונה אתרים פרילאנס"),
    otherPosts: /other posts/i.test(body) || body.includes("Other posts"),
    reactNative: lower.includes("react native"),
    sellerOrOtherPost:
      body.includes("Site Market") ||
      body.includes("ממליץ ממש") ||
      body.includes("### **מחפש שותף"),
    facebookBoilerplate:
      /Image \d+/i.test(body) ||
      body.includes("members") ||
      body.includes("| Facebook") ||
      body.startsWith("Title:"),
    excerptRedacted: redact(body),
  };
}

function normalizeUrlForMatch(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`.replace(/\/$/, "");
  } catch {
    return url.trim();
  }
}

async function postJson(
  url: string,
  apiKey: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; status: number; json: unknown; errorText?: string }> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  });
  const text = await response.text();
  if (!response.ok) {
    return { ok: false, status: response.status, json: null, errorText: text.slice(0, 400) };
  }
  return { ok: true, status: response.status, json: JSON.parse(text) as unknown };
}

function findMatchingSearchResult(
  results: unknown[],
  targetUrl: string
): Record<string, unknown> | null {
  const target = normalizeUrlForMatch(targetUrl);
  for (const item of results) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const url = typeof row.url === "string" ? row.url : "";
    if (url && normalizeUrlForMatch(url) === target) {
      return row;
    }
  }
  return null;
}

async function main(): Promise<void> {
  const apiKey = getTavilyApiKey();
  if (!apiKey) {
    console.error("TAVILY_API_KEY missing in environment.");
    process.exit(1);
  }

  await connectDB();
  const intent = await getIntentById(TARGET_INTENT_ID);
  await mongoose.disconnect();

  if (!intent?.sourceUrl) {
    console.error(`Intent ${TARGET_INTENT_ID} not found or missing sourceUrl.`);
    process.exit(1);
  }

  const targetUrl = intent.sourceUrl;
  const searchQuery =
    intent.discoveryQuery ??
    (typeof intent.rawMetadata?.query === "string" ? intent.rawMetadata.query : undefined) ??
    "מחפש המלצה על בונה אתרים לעסק";

  const policy = getProductionDiscoveryPolicy();
  const tavilyCalls: string[] = [];

  const storedContentAnalysis = analyzeContent(intent.content);

  // Call 1: Search with include_raw_content (same query shape as W3 production)
  const searchBody = {
    query: searchQuery,
    search_depth: policy.tavily.searchDepth,
    max_results: policy.tavily.maxResultsPerQuery,
    include_answer: false,
    include_raw_content: true,
    auto_parameters: false,
    time_range: policy.tavily.timeRange,
    exclude_domains: [...policy.tavily.excludeDomains],
  };

  tavilyCalls.push("POST /search (include_raw_content=true, single query)");
  const searchResponse = await postJson(TAVILY_SEARCH_API_URL, apiKey, searchBody);

  let searchMatch: Record<string, unknown> | null = null;
  let searchContentAnalysis: NoiseReport | null = null;
  let searchRawContentAnalysis: NoiseReport | null = null;
  let searchUsage: unknown = undefined;

  if (searchResponse.ok && searchResponse.json && typeof searchResponse.json === "object") {
    const payload = searchResponse.json as Record<string, unknown>;
    searchUsage = payload.usage ?? payload.response_time;
    const results = Array.isArray(payload.results) ? payload.results : [];
    searchMatch = findMatchingSearchResult(results, targetUrl);
    if (searchMatch) {
      searchContentAnalysis = analyzeContent(
        typeof searchMatch.content === "string" ? searchMatch.content : undefined
      );
      searchRawContentAnalysis = analyzeContent(
        typeof searchMatch.raw_content === "string" ? searchMatch.raw_content : undefined
      );
    }
  }

  // Call 2: Extract exact URL (documented POST /extract)
  tavilyCalls.push("POST /extract (urls=[target], extract_depth=basic)");
  const extractResponse = await postJson(TAVILY_EXTRACT_API_URL, apiKey, {
    urls: [targetUrl],
    extract_depth: "basic",
  });

  let extractAnalysis: NoiseReport | null = null;
  let extractFailed: { url?: string; error?: string } | null = null;
  let extractUsage: unknown = undefined;

  if (extractResponse.ok && extractResponse.json && typeof extractResponse.json === "object") {
    const payload = extractResponse.json as Record<string, unknown>;
    extractUsage = payload.usage ?? payload.response_time;
    const results = Array.isArray(payload.results) ? payload.results : [];
    const failed = Array.isArray(payload.failed_results) ? payload.failed_results : [];
    const hit = results.find(
      (r) =>
        r &&
        typeof r === "object" &&
        typeof (r as Record<string, unknown>).url === "string" &&
        normalizeUrlForMatch(String((r as Record<string, unknown>).url)) ===
          normalizeUrlForMatch(targetUrl)
    ) as Record<string, unknown> | undefined;

    if (hit && typeof hit.raw_content === "string") {
      extractAnalysis = analyzeContent(hit.raw_content);
    } else if (failed[0] && typeof failed[0] === "object") {
      const f = failed[0] as Record<string, unknown>;
      extractFailed = {
        url: typeof f.url === "string" ? f.url : undefined,
        error: typeof f.error === "string" ? f.error.slice(0, 300) : String(f.error ?? "unknown"),
      };
    }
  }

  const runAt = new Date();
  const runDir = join(
    process.cwd(),
    "artifacts",
    "discovery-poc",
    "content-fidelity",
    runAt.toISOString().replace(/[:.]/g, "-")
  );
  mkdirSync(runDir, { recursive: true });

  const report = {
    poc: "content-fidelity-facebook",
    runAt: runAt.toISOString(),
    targetIntentId: TARGET_INTENT_ID,
    targetUrlHostPath: (() => {
      try {
        const u = new URL(targetUrl);
        return `${u.hostname}${u.pathname}`;
      } catch {
        return "[invalid-url]";
      }
    })(),
    searchQueryUsed: searchQuery,
    tavilyCallCount: tavilyCalls.length,
    tavilyCalls,
    storedIntentContent: storedContentAnalysis,
    searchApi: {
      httpOk: searchResponse.ok,
      httpStatus: searchResponse.status,
      matchedTargetUrl: Boolean(searchMatch),
      resultFieldsPresent: searchMatch
        ? {
            hasContent: typeof searchMatch.content === "string",
            hasRawContent: typeof searchMatch.raw_content === "string",
            hasScore: typeof searchMatch.score === "number",
          }
        : null,
      content: searchContentAnalysis,
      raw_content: searchRawContentAnalysis,
      usageOrTiming: searchUsage,
      error: searchResponse.ok ? undefined : searchResponse.errorText,
    },
    extractApi: {
      httpOk: extractResponse.ok,
      httpStatus: extractResponse.status,
      content: extractAnalysis,
      failed: extractFailed,
      usageOrTiming: extractUsage,
      error: extractResponse.ok ? undefined : extractResponse.errorText,
    },
  };

  const reportPath = join(runDir, "fidelity-report.json");
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("Content fidelity PoC complete.");
  console.log(`Tavily calls: ${tavilyCalls.length}`);
  console.log(`Report: ${reportPath}`);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

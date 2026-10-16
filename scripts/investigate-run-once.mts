import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { connectDB } from "../src/lib/db/mongoose.ts";
import { WebsiteAnalysisRun } from "../src/models/WebsiteAnalysisRun.ts";
import { resolvePageSpeedInsightsEnv } from "../src/lib/website-check/pagespeed-env.ts";
import { fetchMobilePageSpeedInsights } from "../src/lib/website-check/psi/pagespeed-fetch.ts";
import { buildPageSpeedInsightsRequestUrl } from "../src/lib/website-check/psi/pagespeed-request.ts";

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const match = line.match(/^\s*([^#=]+)=(.*)$/);
      if (!match) continue;
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

loadEnvLocal();

const runId = process.argv[2] ?? "6ad21c2f5ff383e6f0ab5dfc";
const probeUrl = process.argv[3] ?? "https://www.shiputi.co.il/";

await connectDB();
const run = await WebsiteAnalysisRun.findById(runId).lean();
console.log(
  JSON.stringify(
    {
      runFound: Boolean(run),
      id: run?._id?.toString(),
      urlNormalized: run?.urlNormalized,
      status: run?.status,
      phase: run?.phase,
      error: run?.error,
      startedAt: run?.startedAt,
      completedAt: run?.completedAt,
    },
    null,
    2
  )
);

const started = Date.now();
const env = resolvePageSpeedInsightsEnv(process.env);
if (!env) {
  console.log(JSON.stringify({ psiProbe: { ok: false, reason: "psi_not_configured" } }));
  process.exit(0);
}
const psi = await fetchMobilePageSpeedInsights({
  url: probeUrl,
  apiKey: env.apiKey,
  timeoutMs: env.timeoutMs,
});
const elapsedMs = Date.now() - started;

if (psi.ok) {
  console.log(JSON.stringify({ psiProbe: { ok: true, elapsedMs } }));
} else {
  let safeBody: string | undefined;
  // already failed in fetch - re-fetch status only via direct call for message
  let upstreamMessage: string | undefined;
  let upstreamStatus: string | undefined;
  try {
    const requestUrl = buildPageSpeedInsightsRequestUrl({ url: probeUrl, apiKey: env.apiKey });
    const res = await fetch(requestUrl, { headers: { Accept: "application/json" } });
    const body = (await res.json()) as { error?: { message?: string; status?: string } };
    upstreamMessage = body.error?.message?.slice(0, 300);
    upstreamStatus = body.error?.status;
  } catch {
    // ignore
  }

  console.log(
    JSON.stringify({
      psiProbe: {
        ok: false,
        code: psi.code,
        httpStatus: psi.httpStatus,
        messagePublic: psi.messagePublic,
        elapsedMs,
        upstreamMessage,
        upstreamStatus,
      },
    })
  );
}

process.exit(0);

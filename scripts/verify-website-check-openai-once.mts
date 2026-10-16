import OpenAI from "openai";
import { buildWebsiteCheckAiResponsesCreateParams } from "../src/lib/website-check/ai/website-check-openai-request.ts";
import { resolveWebsiteCheckAiEnv } from "../src/lib/website-check/ai/website-check-ai-env.ts";
import { validateWebsiteCheckAiModelOutput } from "../src/lib/website-check/ai/validate-website-check-ai-output.ts";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

const env = resolveWebsiteCheckAiEnv(process.env);
if (!env) {
  console.log("SKIP: WEBSITE_CHECK_AI_ENABLED or OPENAI_API_KEY not set");
  process.exit(0);
}

const input = {
  scores: { performance: 72, seo: 91, accessibility: 88, ux: 96, overall: 85 },
  findings: [
    {
      auditId: "largest-contentful-paint",
      category: "performance",
      auditKind: "opportunity",
      status: "warning",
      displayValue: "3.2 s",
    },
  ],
};

const client = new OpenAI({ apiKey: env.apiKey });

try {
  const res = await client.responses.create(
    buildWebsiteCheckAiResponsesCreateParams(env, JSON.stringify(input))
  );
  const raw = JSON.parse(res.output_text ?? "{}") as unknown;
  const validated = validateWebsiteCheckAiModelOutput(raw, input);
  if (!validated) {
    console.log("LIVE_FAIL: response did not pass validation");
    process.exit(1);
  }
  console.log(`LIVE_OK recommendations=${validated.recommendations.length}`);
} catch (error: unknown) {
  const api = error as {
    status?: number;
    error?: { message?: string; param?: string; code?: string; type?: string };
  };
  console.log(
    JSON.stringify({
      LIVE_FAIL: true,
      status: api.status,
      param: api.error?.param,
      code: api.error?.code,
      type: api.error?.type,
      message: api.error?.message?.slice(0, 200),
    })
  );
  process.exit(1);
}

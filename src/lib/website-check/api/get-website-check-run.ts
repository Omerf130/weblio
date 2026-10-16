import { toPublicWebsiteAnalysisRunDto } from "@/lib/website-check/public-run-dto";
import {
  expireStaleWebsiteAnalysisRuns,
  getWebsiteAnalysisRunById,
} from "@/lib/data/website-analysis-runs";
import type { PublicWebsiteAnalysisRunDto } from "@/lib/website-check/public-run-dto";
const GENERIC_ERROR = "לא נמצא ניתוח עבור המזהה שסופק.";

export type GetWebsiteCheckRunResult =
  | { ok: true; run: PublicWebsiteAnalysisRunDto }
  | { ok: false; status: 404 | 400; error: string };

export type WebsiteCheckGetRunDeps = {
  expireStaleWebsiteAnalysisRuns: typeof expireStaleWebsiteAnalysisRuns;
  getWebsiteAnalysisRunById: typeof getWebsiteAnalysisRunById;
};

function getDefaultDeps(): WebsiteCheckGetRunDeps {
  return {
    expireStaleWebsiteAnalysisRuns,
    getWebsiteAnalysisRunById,
  };
}

export async function handleGetWebsiteCheckRun(
  id: string,
  deps: Partial<WebsiteCheckGetRunDeps> = {}
): Promise<GetWebsiteCheckRunResult> {
  const resolved = { ...getDefaultDeps(), ...deps };

  if (!id.trim()) {
    return { ok: false, status: 400, error: GENERIC_ERROR };
  }

  await resolved.expireStaleWebsiteAnalysisRuns();

  const run = await resolved.getWebsiteAnalysisRunById(id);
  if (!run) {
    return { ok: false, status: 404, error: GENERIC_ERROR };
  }

  return {
    ok: true,
    run: toPublicWebsiteAnalysisRunDto(run),
  };
}

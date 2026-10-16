import { isWebsiteCheckLiveAnalysisConfigured } from "@/lib/website-check/pagespeed-env";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    liveAvailable: isWebsiteCheckLiveAnalysisConfigured(),
  });
}

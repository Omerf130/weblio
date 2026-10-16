import { requireAdminForApi } from "@/lib/auth/require-admin-api";
import { handleAdminWebsiteCheckRunsGet } from "@/lib/admin/website-check/handle-admin-website-check-runs";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAdminForApi();
  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const result = await handleAdminWebsiteCheckRunsGet(url.searchParams);

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({
    summary: result.summary,
    list: result.list,
  });
}

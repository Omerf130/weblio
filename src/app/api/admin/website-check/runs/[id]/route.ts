import { requireAdminForApi } from "@/lib/auth/require-admin-api";
import { handleAdminWebsiteCheckRunDetailGet } from "@/lib/admin/website-check/handle-admin-website-check-run-detail";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminForApi();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const result = await handleAdminWebsiteCheckRunDetailGet(id);

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ run: result.run });
}

import { handleGetWebsiteCheckRun } from "@/lib/website-check/api/get-website-check-run";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const result = await handleGetWebsiteCheckRun(id);

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ run: result.run });
}

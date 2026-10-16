import { getAdminWebsiteCheckRunDetail } from "@/lib/data/admin-website-analysis-runs";

export type AdminWebsiteCheckRunDetailApiResult =
  | { ok: true; run: NonNullable<Awaited<ReturnType<typeof getAdminWebsiteCheckRunDetail>>> }
  | { ok: false; status: 404 | 400; error: string };

export async function handleAdminWebsiteCheckRunDetailGet(
  id: string
): Promise<AdminWebsiteCheckRunDetailApiResult> {
  const trimmed = id.trim();
  if (!trimmed) {
    return { ok: false, status: 400, error: "Not found" };
  }

  const run = await getAdminWebsiteCheckRunDetail(trimmed);
  if (!run) {
    return { ok: false, status: 404, error: "Not found" };
  }

  return { ok: true, run };
}

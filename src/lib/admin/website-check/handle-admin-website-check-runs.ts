import {
  getAdminWebsiteCheckRunList,
  getAdminWebsiteCheckRunSummary,
} from "@/lib/data/admin-website-analysis-runs";
import { adminWebsiteCheckListQuerySchema } from "@/lib/admin/website-check/list-query";

export type AdminWebsiteCheckRunsApiResult =
  | {
      ok: true;
      summary: Awaited<ReturnType<typeof getAdminWebsiteCheckRunSummary>>;
      list: Awaited<ReturnType<typeof getAdminWebsiteCheckRunList>>;
    }
  | { ok: false; status: 400; error: string };

export async function handleAdminWebsiteCheckRunsGet(
  searchParams: URLSearchParams
): Promise<AdminWebsiteCheckRunsApiResult> {
  const parsed = adminWebsiteCheckListQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    hasLead: searchParams.get("hasLead") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, status: 400, error: "Invalid query" };
  }

  const [summary, list] = await Promise.all([
    getAdminWebsiteCheckRunSummary(),
    getAdminWebsiteCheckRunList(parsed.data),
  ]);

  return { ok: true, summary, list };
}

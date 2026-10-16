import WebsiteCheckRunsManager from "@/components/admin/website-check/WebsiteCheckRunsManager";
import { parseAdminWebsiteCheckListQuery } from "@/lib/admin/website-check/list-query";
import {
  parseAdminWebsiteCheckLeadFilter,
  parseAdminWebsiteCheckStatusFilter,
} from "@/lib/admin/website-check/list-url";
import {
  getAdminWebsiteCheckRunList,
  getAdminWebsiteCheckRunSummary,
} from "@/lib/data/admin-website-analysis-runs";

type WebsiteCheckAdminPageProps = {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    q?: string;
    status?: string;
    hasLead?: string;
    error?: string;
  }>;
};

export default async function WebsiteCheckAdminPage({
  searchParams,
}: WebsiteCheckAdminPageProps) {
  const params = await searchParams;
  const status = parseAdminWebsiteCheckStatusFilter(params.status);
  const hasLead = parseAdminWebsiteCheckLeadFilter(params.hasLead);
  const q = params.q?.trim() ?? "";

  let listQuery;
  try {
    listQuery = parseAdminWebsiteCheckListQuery({
      page: params.page,
      pageSize: params.pageSize,
      q: q || undefined,
      status,
      hasLead,
    });
  } catch {
    listQuery = parseAdminWebsiteCheckListQuery({
      page: "1",
      status: "all",
      hasLead: "all",
    });
  }

  const [summary, list] = await Promise.all([
    getAdminWebsiteCheckRunSummary(),
    getAdminWebsiteCheckRunList(listQuery),
  ]);

  return (
    <WebsiteCheckRunsManager
      summary={summary}
      items={list.items}
      status={status}
      hasLead={hasLead}
      q={q}
      pagination={{
        page: list.page,
        totalPages: list.totalPages,
        totalItems: list.totalItems,
      }}
      errorMessage={params.error ? decodeURIComponent(params.error) : undefined}
    />
  );
}

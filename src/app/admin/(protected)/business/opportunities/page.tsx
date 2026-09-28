import { getOpportunityList } from "@/lib/data/opportunities";
import {
  parseOpportunityClassificationFilter,
  parseOpportunitySourceFilter,
  parseOpportunityStatusFilter,
} from "@/lib/business/opportunities/list-url";
import OpportunitiesManager from "@/components/admin/business/opportunities/OpportunitiesManager";

type OpportunitiesPageProps = {
  searchParams: Promise<{
    status?: string;
    classification?: string;
    source?: string;
    q?: string;
    page?: string;
    new?: string;
  }>;
};

export default async function OpportunitiesPage({ searchParams }: OpportunitiesPageProps) {
  const query = await searchParams;
  const status = parseOpportunityStatusFilter(query.status);
  const classification = parseOpportunityClassificationFilter(query.classification);
  const source = parseOpportunitySourceFilter(query.source);
  const q = query.q?.trim() ?? "";
  const page = Math.max(1, Number(query.page) || 1);
  const autoOpenNew = query.new === "1";

  const result = await getOpportunityList({
    page,
    status: status === "all" ? undefined : status,
    classification: classification === "all" ? undefined : classification,
    source: source === "all" ? undefined : source,
    q: q || undefined,
    sort: "-createdAt",
  });

  const hasActiveFilters =
    status !== "all" ||
    classification !== "all" ||
    source !== "all" ||
    q.length > 0;

  return (
    <OpportunitiesManager
      opportunities={result.items}
      status={status}
      classification={classification}
      source={source}
      q={q}
      pagination={{
        page: result.page,
        totalPages: result.totalPages,
        totalItems: result.totalItems,
      }}
      autoOpenNew={autoOpenNew}
      hasActiveFilters={hasActiveFilters}
    />
  );
}

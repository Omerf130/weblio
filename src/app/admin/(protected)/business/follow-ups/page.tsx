import {
  getFollowUpList,
  getPendingFollowUpsDueToday,
  getOverdueFollowUps,
  getUpcomingFollowUps,
} from "@/lib/data/follow-ups";
import { getRecentLeadOptions, getLeadSummaries } from "@/lib/data/leads";
import type { AdminFollowUpDto } from "@/types/follow-up";
import type { FollowUpFilter } from "@/components/admin/business/follow-ups/FollowUpFilterTabs";
import FollowUpsManager from "@/components/admin/business/follow-ups/FollowUpsManager";

type FollowUpsPageProps = {
  searchParams: Promise<{
    filter?: string;
    page?: string;
    new?: string;
    leadId?: string;
  }>;
};

const VALID_FILTERS = new Set<FollowUpFilter>([
  "all",
  "today",
  "overdue",
  "upcoming",
  "completed",
  "cancelled",
]);

function parseFilter(value?: string): FollowUpFilter {
  if (value && VALID_FILTERS.has(value as FollowUpFilter)) {
    return value as FollowUpFilter;
  }
  return "all";
}

export default async function FollowUpsPage({ searchParams }: FollowUpsPageProps) {
  const query = await searchParams;
  const filter = parseFilter(query.filter);
  const page = Math.max(1, Number(query.page) || 1);
  const autoOpenNew = query.new === "1";
  const preselectedLeadId = query.leadId;

  let followUps: AdminFollowUpDto[] = [];
  let pagination: { page: number; totalPages: number; total: number } | undefined;

  switch (filter) {
    case "today":
      followUps = await getPendingFollowUpsDueToday();
      break;
    case "overdue":
      followUps = await getOverdueFollowUps();
      break;
    case "upcoming":
      followUps = await getUpcomingFollowUps(7);
      break;
    case "completed": {
      const result = await getFollowUpList({
        page,
        status: "completed",
        sort: "-createdAt",
      });
      followUps = result.items;
      pagination = { page: result.page, totalPages: result.totalPages, total: result.total };
      break;
    }
    case "cancelled": {
      const result = await getFollowUpList({
        page,
        status: "cancelled",
        sort: "-createdAt",
      });
      followUps = result.items;
      pagination = { page: result.page, totalPages: result.totalPages, total: result.total };
      break;
    }
    default: {
      const result = await getFollowUpList({
        page,
        status: "pending",
        sort: "dueAt",
      });
      followUps = result.items;
      pagination = { page: result.page, totalPages: result.totalPages, total: result.total };
      break;
    }
  }

  const leadIds = followUps
    .map((fu) => fu.leadId)
    .filter((id): id is string => !!id);

  const [leadOptions, leadSummariesMap] = await Promise.all([
    getRecentLeadOptions(50),
    leadIds.length > 0 ? getLeadSummaries(leadIds) : Promise.resolve(new Map()),
  ]);

  const leadSummaries: Record<string, { id: string; leadNumber: number; name: string }> = {};
  for (const [key, value] of leadSummariesMap) {
    leadSummaries[key] = value;
  }

  return (
    <FollowUpsManager
      followUps={followUps}
      leadSummaries={leadSummaries}
      leadOptions={leadOptions}
      activeFilter={filter}
      pagination={pagination}
      autoOpenNew={autoOpenNew}
      preselectedLeadId={preselectedLeadId}
    />
  );
}

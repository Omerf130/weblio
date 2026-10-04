import { getBusinessOverviewDashboardData } from "@/lib/business/overview-dashboard-data";
import { getLeadSummaries } from "@/lib/data/leads";
import { getOpportunitySummaries } from "@/lib/data/opportunities";
import BusinessOverviewDashboard from "@/components/admin/business/overview/BusinessOverviewDashboard";

export default async function BusinessOverviewPage() {
  const data = await getBusinessOverviewDashboardData();

  const leadIds = data.activity.followUps
    .map((fu) => fu.leadId)
    .filter((id): id is string => !!id);
  const opportunityIds = data.activity.followUps
    .map((fu) => fu.opportunityId)
    .filter((id): id is string => !!id);

  const [leadSummariesMap, opportunitySummariesMap] = await Promise.all([
    leadIds.length > 0
      ? getLeadSummaries([...new Set(leadIds)])
      : Promise.resolve(new Map()),
    opportunityIds.length > 0
      ? getOpportunitySummaries([...new Set(opportunityIds)])
      : Promise.resolve(new Map()),
  ]);

  return (
    <div dir="rtl">
      <BusinessOverviewDashboard
        data={data}
        leadSummaries={leadSummariesMap}
        opportunitySummaries={opportunitySummariesMap}
      />
    </div>
  );
}

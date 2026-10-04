import { getBusinessOverviewDashboardData } from "@/lib/business/overview-dashboard-data";
import type { BusinessOverviewData } from "@/types/business";

/** @deprecated Prefer getBusinessOverviewDashboardData */
export async function getBusinessOverviewData(): Promise<BusinessOverviewData> {
  const dashboard = await getBusinessOverviewDashboardData();
  return {
    unreadLeadCount: dashboard.kpis.unreadLeadCount,
    newLeadsLast7Days: dashboard.kpis.newLeadsLast7Days,
    newOpportunitiesCount: dashboard.kpis.newOpportunitiesLast7Days,
    activeOpportunitiesCount: dashboard.kpis.activeOpportunitiesCount,
    actionableIntentsCount: dashboard.kpis.classifiedReviewIntentsCount,
    followUpsDueToday: dashboard.activity.followUps.filter((f) => f.urgency === "today"),
    overdueFollowUps: dashboard.activity.followUps.filter((f) => f.urgency === "overdue"),
    upcomingFollowUps: dashboard.activity.followUps.filter((f) => f.urgency === "upcoming"),
  };
}

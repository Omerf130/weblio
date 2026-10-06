import type { DashboardDailyLeadPoint, DashboardKpiComparison } from "./dashboard";
import type { AdminFollowUpDto } from "./follow-up";
import type { AdminIntentListItemDto } from "./intent";
import type { AdminOpportunityDto, OpportunityStatus } from "./opportunity";
import type { DiscoveryRunDto } from "./discovery-run";
import type { BusinessOverviewDiscoveryCronDiagnostics } from "./discovery-cron-diagnostic";

export type DiscoveryAutomationHealthState =
  | "disabled"
  | "healthy"
  | "not_run_today"
  | "running"
  | "partial"
  | "failed"
  | "credit_stopped";

export type BusinessOverviewDiscoveryAutomationHealth = {
  state: DiscoveryAutomationHealthState;
  label: string;
};

export type BusinessOverviewMonthlyCreditUsage = {
  monthKey: string;
  estimatedCreditsUsed: number;
  runCountWithSpend: number;
  softWarnReached: boolean;
  hardStopReached: boolean;
  hardStopLimit: number;
  softWarnLimit: number;
};

export type OperationalOpportunityStatusCount = {
  status: Extract<OpportunityStatus, "new" | "researching" | "contacted">;
  count: number;
};

export type BusinessOverviewActivityFollowUp = AdminFollowUpDto & {
  urgency: "overdue" | "today" | "upcoming";
};

export type BusinessOverviewDashboardData = {
  kpis: {
    newLeadsLast7Days: number;
    newLeadsPrevious7Days: number;
    newLeadsComparison: DashboardKpiComparison;
    unreadLeadCount: number;
    classifiedReviewIntentsCount: number;
    activeOpportunitiesCount: number;
    newOpportunitiesLast7Days: number;
    overdueFollowUpsCount: number;
  };
  dailyLeads7Days: DashboardDailyLeadPoint[];
  activity: {
    followUps: BusinessOverviewActivityFollowUp[];
    unreadLeadCount: number;
    recentNewOpportunities: AdminOpportunityDto[];
  };
  opportunityStatusCounts: OperationalOpportunityStatusCount[];
  recentClassifiedIntents: AdminIntentListItemDto[];
  discovery: {
    automationHealth: BusinessOverviewDiscoveryAutomationHealth;
    latestRun: DiscoveryRunDto | null;
    monthlyCredits: BusinessOverviewMonthlyCreditUsage;
    cronDiagnostics: BusinessOverviewDiscoveryCronDiagnostics;
  };
};

/** @deprecated Use BusinessOverviewDashboardData via getBusinessOverviewDashboardData */
export type BusinessOverviewData = {
  unreadLeadCount: number;
  newLeadsLast7Days: number;
  newOpportunitiesCount: number;
  activeOpportunitiesCount: number;
  actionableIntentsCount: number;
  followUpsDueToday: AdminFollowUpDto[];
  overdueFollowUps: AdminFollowUpDto[];
  upcomingFollowUps: AdminFollowUpDto[];
};

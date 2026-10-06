import {
  aggregateCountsByDate,
  buildDailyLeadSeries,
  calculatePercentChange,
} from "@/lib/admin/dashboard-stats";
import { getIsraelCalendarDateKey } from "@/lib/admin/israel-calendar-date";
import { getIsraelDaysAgo } from "@/lib/admin/dashboard-time";
import { buildBusinessOverviewDiscoveryCronDiagnostics } from "@/lib/business/discovery/cron-diagnostics-overview";
import { deriveDiscoveryAutomationHealth } from "@/lib/business/discovery/automation-health";
import { findLatestDiscoveryCronDiagnostic } from "@/lib/data/discovery-cron-diagnostics";
import { getDiscoveryAutomationConfig } from "@/lib/discovery/discovery-automation-env";
import { getDiscoveryMonthlyCreditUsage } from "@/lib/data/discovery-monthly-credits";
import {
  findActiveDiscoveryRun,
  findLatestCompletedDiscoveryRun,
  findScheduledDiscoveryRunForIsraelDate,
} from "@/lib/data/discovery-runs";
import {
  countOverdueFollowUps,
  getOverdueFollowUps,
  getPendingFollowUpsDueToday,
  getUpcomingFollowUps,
} from "@/lib/data/follow-ups";
import {
  countClassifiedReviewIntents,
  listRecentClassifiedReviewIntents,
} from "@/lib/data/intents";
import { getUnreadLeadCount } from "@/lib/data/leads";
import { listRecentNewOpportunities } from "@/lib/data/opportunities";
import {
  countActiveOpportunities,
  countNewOpportunitiesLast7Days,
  countOperationalOpportunityStatuses,
} from "@/lib/data/opportunity-conversion";
import { connectDB } from "@/lib/db/mongoose";
import { Lead } from "@/models/Lead";
import type {
  BusinessOverviewActivityFollowUp,
  BusinessOverviewDashboardData,
} from "@/types/business";

const ACTIVITY_OVERDUE_LIMIT = 5;
const ACTIVITY_TODAY_LIMIT = 4;
const ACTIVITY_UPCOMING_LIMIT = 3;

export async function getBusinessOverviewDashboardData(
  reference = new Date()
): Promise<BusinessOverviewDashboardData> {
  await connectDB();

  const sevenDaysAgo = getIsraelDaysAgo(7, reference);
  const fourteenDaysAgo = getIsraelDaysAgo(14, reference);
  const sixDaysAgo = getIsraelDaysAgo(6, reference);
  const israelTodayKey = getIsraelCalendarDateKey(reference);
  const automationConfig = getDiscoveryAutomationConfig();

  const [
    unreadLeadCount,
    newLeadsLast7Days,
    newLeadsPrevious7Days,
    classifiedReviewIntentsCount,
    activeOpportunitiesCount,
    newOpportunitiesLast7Days,
    overdueFollowUpsCount,
    overdueFollowUps,
    followUpsDueToday,
    upcomingFollowUps,
    dailyLeadRows,
    opportunityStatusCounts,
    recentClassifiedIntents,
    latestRun,
    activeRun,
    scheduledRunToday,
    monthlyCredits,
    recentNewOpportunities,
    latestCronDiagnostic,
  ] = await Promise.all([
    getUnreadLeadCount(),
    Lead.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Lead.countDocuments({
      createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
    }),
    countClassifiedReviewIntents(),
    countActiveOpportunities(),
    countNewOpportunitiesLast7Days(sevenDaysAgo),
    countOverdueFollowUps(reference),
    getOverdueFollowUps(reference, ACTIVITY_OVERDUE_LIMIT),
    getPendingFollowUpsDueToday(reference, ACTIVITY_TODAY_LIMIT),
    getUpcomingFollowUps(7, reference, ACTIVITY_UPCOMING_LIMIT),
    Lead.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: sixDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "Asia/Jerusalem",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    countOperationalOpportunityStatuses(),
    listRecentClassifiedReviewIntents(5),
    findLatestCompletedDiscoveryRun(),
    findActiveDiscoveryRun(),
    findScheduledDiscoveryRunForIsraelDate(israelTodayKey),
    getDiscoveryMonthlyCreditUsage({ referenceDate: reference }),
    listRecentNewOpportunities(3),
    findLatestDiscoveryCronDiagnostic(),
  ]);

  const followUps: BusinessOverviewActivityFollowUp[] = [
    ...overdueFollowUps.map((item) => ({ ...item, urgency: "overdue" as const })),
    ...followUpsDueToday.map((item) => ({ ...item, urgency: "today" as const })),
    ...upcomingFollowUps.map((item) => ({ ...item, urgency: "upcoming" as const })),
  ];

  const cronDiagnostics = buildBusinessOverviewDiscoveryCronDiagnostics(
    latestCronDiagnostic
  );

  const automationHealth = deriveDiscoveryAutomationHealth({
    automationEnabled: automationConfig.automationEnabled,
    activeRun,
    scheduledRunToday,
    reference,
  });

  return {
    kpis: {
      newLeadsLast7Days,
      newLeadsPrevious7Days,
      newLeadsComparison: calculatePercentChange(
        newLeadsLast7Days,
        newLeadsPrevious7Days
      ),
      unreadLeadCount,
      classifiedReviewIntentsCount,
      activeOpportunitiesCount,
      newOpportunitiesLast7Days,
      overdueFollowUpsCount,
    },
    dailyLeads7Days: buildDailyLeadSeries(
      aggregateCountsByDate(dailyLeadRows),
      reference,
      7
    ),
    activity: {
      followUps,
      unreadLeadCount,
      recentNewOpportunities,
    },
    opportunityStatusCounts,
    recentClassifiedIntents,
    discovery: {
      automationHealth,
      latestRun,
      monthlyCredits,
      cronDiagnostics,
    },
  };
}

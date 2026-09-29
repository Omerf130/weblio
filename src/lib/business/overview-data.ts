import { countActionableIntents } from "@/lib/data/intents";
import { getUnreadLeadCount } from "@/lib/data/leads";
import {
  getPendingFollowUpsDueToday,
  getOverdueFollowUps,
  getUpcomingFollowUps,
} from "@/lib/data/follow-ups";
import { getIsraelDaysAgo } from "@/lib/admin/dashboard-time";
import {
  countActiveOpportunities,
  countNewOpportunities,
} from "@/lib/data/opportunity-conversion";
import { connectDB } from "@/lib/db/mongoose";
import { Lead } from "@/models/Lead";
import type { BusinessOverviewData } from "@/types/business";

export async function getBusinessOverviewData(): Promise<BusinessOverviewData> {
  await connectDB();

  const sevenDaysAgo = getIsraelDaysAgo(7);

  const [
    unreadLeadCount,
    newLeadsLast7Days,
    newOpportunitiesCount,
    activeOpportunitiesCount,
    actionableIntentsCount,
    followUpsDueToday,
    overdueFollowUps,
    upcomingFollowUps,
  ] = await Promise.all([
    getUnreadLeadCount(),
    Lead.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    countNewOpportunities(),
    countActiveOpportunities(),
    countActionableIntents(),
    getPendingFollowUpsDueToday(),
    getOverdueFollowUps(),
    getUpcomingFollowUps(7),
  ]);

  return {
    unreadLeadCount,
    newLeadsLast7Days,
    newOpportunitiesCount,
    activeOpportunitiesCount,
    actionableIntentsCount,
    followUpsDueToday,
    overdueFollowUps,
    upcomingFollowUps,
  };
}

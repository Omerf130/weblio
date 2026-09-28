import type { AdminFollowUpDto } from "./follow-up";

export type BusinessOverviewData = {
  unreadLeadCount: number;
  newLeadsLast7Days: number;
  newOpportunitiesCount: number;
  activeOpportunitiesCount: number;
  followUpsDueToday: AdminFollowUpDto[];
  overdueFollowUps: AdminFollowUpDto[];
  upcomingFollowUps: AdminFollowUpDto[];
};

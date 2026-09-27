import type { AdminFollowUpDto } from "./follow-up";

export type BusinessOverviewData = {
  unreadLeadCount: number;
  newLeadsLast7Days: number;
  followUpsDueToday: AdminFollowUpDto[];
  overdueFollowUps: AdminFollowUpDto[];
  upcomingFollowUps: AdminFollowUpDto[];
};

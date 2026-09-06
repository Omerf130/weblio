import type { LeadSource, LeadStatus } from "@/types/lead";

export type DashboardLeadSummary = {
  id: string;
  leadNumber: number;
  name: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  createdAt: string;
};

export type DashboardProjectSummary = {
  id: string;
  title: string;
  imageUrl: string;
  imageAlt: string;
  updatedAt: string;
};

export type DashboardDailyLeadPoint = {
  date: string;
  label: string;
  count: number;
};

export type DashboardSourceSlice = {
  source: LeadSource;
  label: string;
  count: number;
};

export type DashboardKpiComparison = {
  percentChange: number;
  direction: "up" | "down" | "flat";
} | null;

export type DashboardLandingSummary = {
  heroImageUrl: string | null;
  heroImageAlt: string;
  heroTitle: string;
  totalLeads: number;
  leadsLast7Days: number;
};

export type DashboardStats = {
  leadsLast7Days: number;
  leadsThisMonth: number;
  leadsPreviousMonthSamePeriod: number;
  totalLeads: number;
  totalProjects: number;
  dailyLeads: DashboardDailyLeadPoint[];
  sourceBreakdown: DashboardSourceSlice[];
  recentLeads: DashboardLeadSummary[];
  recentProjects: DashboardProjectSummary[];
  landing: DashboardLandingSummary;
};

export type Ga4TrafficStatus = "unavailable" | "connected";

export type Ga4TrafficSummary = {
  status: Ga4TrafficStatus;
  weekVisitors: number | null;
  monthVisitors: number | null;
  weekComparison: DashboardKpiComparison;
  monthComparison: DashboardKpiComparison;
};

export type DashboardPageData = {
  stats: DashboardStats;
  traffic: Ga4TrafficSummary;
};

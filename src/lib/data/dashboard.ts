import mongoose from "mongoose";
import {
  aggregateCountsByDate,
  aggregateSourceCounts,
  buildDailyLeadSeries,
  buildSourceBreakdown,
} from "@/lib/admin/dashboard-stats";
import {
  getIsraelDaysAgo,
  getIsraelMonthStart,
  getIsraelPreviousMonthSamePeriodEnd,
  getIsraelPreviousMonthStart,
} from "@/lib/admin/dashboard-time";
import { getGa4TrafficSummary } from "@/lib/analytics/ga4-traffic";
import { connectDB } from "@/lib/db/mongoose";
import { STATIC_BUILD_YOUR_DREAM_CONTENT } from "@/lib/content/build-your-dream/static-content";
import {
  BUILD_YOUR_DREAM_LANDING_KEY,
  BuildYourDreamLanding,
} from "@/models/BuildYourDreamLanding";
import { Lead, type LeadDocument } from "@/models/Lead";
import { Project, type ProjectDocument } from "@/models/Project";
import type {
  DashboardLandingSummary,
  DashboardLeadSummary,
  DashboardPageData,
  DashboardProjectSummary,
  DashboardStats,
} from "@/types/dashboard";
import type { LeadSource, LeadStatus } from "@/types/lead";

type LeanLead = Omit<LeadDocument, keyof mongoose.Document> & {
  _id: mongoose.Types.ObjectId;
};

type LeanProject = Omit<ProjectDocument, keyof mongoose.Document> & {
  _id: mongoose.Types.ObjectId;
};

function toDashboardLeadSummary(lead: LeanLead): DashboardLeadSummary {
  return {
    id: lead._id.toString(),
    leadNumber: lead.leadNumber,
    name: lead.name,
    phone: lead.phone,
    source: lead.source as LeadSource,
    status: lead.status as LeadStatus,
    createdAt: lead.createdAt.toISOString(),
  };
}

function toDashboardProjectSummary(project: LeanProject): DashboardProjectSummary {
  return {
    id: project._id.toString(),
    title: project.title,
    imageUrl: project.image.url,
    imageAlt: project.image.alt,
    updatedAt: project.updatedAt.toISOString(),
  };
}

async function getLandingDashboardSummary(): Promise<DashboardLandingSummary> {
  await connectDB();

  const [landingDoc, totalLeads, leadsLast7Days] = await Promise.all([
    BuildYourDreamLanding.findOne({ singletonKey: BUILD_YOUR_DREAM_LANDING_KEY })
      .select("hero images")
      .lean<{ hero?: { title?: string }; images?: { hero?: { url?: string; alt?: string } } } | null>(),
    Lead.countDocuments({ source: "landingPage" }),
    Lead.countDocuments({
      source: "landingPage",
      createdAt: { $gte: getIsraelDaysAgo(7) },
    }),
  ]);

  const fallbackContent = STATIC_BUILD_YOUR_DREAM_CONTENT;
  const heroTitle = landingDoc?.hero?.title ?? fallbackContent.hero.title;
  const heroImageUrl =
    landingDoc?.images?.hero?.url ?? fallbackContent.images.hero.src ?? null;
  const heroImageAlt =
    landingDoc?.images?.hero?.alt ?? fallbackContent.images.hero.alt ?? heroTitle;

  return {
    heroImageUrl,
    heroImageAlt,
    heroTitle,
    totalLeads,
    leadsLast7Days,
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await connectDB();

  const now = new Date();
  const sevenDaysAgo = getIsraelDaysAgo(7);
  const thirtyDaysAgo = getIsraelDaysAgo(29);
  const monthStart = getIsraelMonthStart(now);
  const previousMonthStart = getIsraelPreviousMonthStart(now);
  const previousMonthSamePeriodEnd = getIsraelPreviousMonthSamePeriodEnd(now);

  const [
    leadsLast7Days,
    leadsThisMonth,
    leadsPreviousMonthSamePeriod,
    totalLeads,
    totalProjects,
    dailyLeadRows,
    sourceRows,
    recentLeads,
    recentProjects,
    landing,
  ] = await Promise.all([
    Lead.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Lead.countDocuments({ createdAt: { $gte: monthStart } }),
    Lead.countDocuments({
      createdAt: {
        $gte: previousMonthStart,
        $lte: previousMonthSamePeriodEnd,
      },
    }),
    Lead.countDocuments({}),
    Project.countDocuments({}),
    Lead.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
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
    Lead.aggregate<{ _id: LeadSource; count: number }>([
      { $group: { _id: "$source", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Lead.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean<LeanLead[]>(),
    Project.find({})
      .sort({ updatedAt: -1 })
      .limit(3)
      .lean<LeanProject[]>(),
    getLandingDashboardSummary(),
  ]);

  return {
    leadsLast7Days,
    leadsThisMonth,
    leadsPreviousMonthSamePeriod,
    totalLeads,
    totalProjects,
    dailyLeads: buildDailyLeadSeries(aggregateCountsByDate(dailyLeadRows), now, 30),
    sourceBreakdown: buildSourceBreakdown(aggregateSourceCounts(sourceRows)),
    recentLeads: recentLeads.map(toDashboardLeadSummary),
    recentProjects: recentProjects.map(toDashboardProjectSummary),
    landing,
  };
}

export async function getDashboardPageData(): Promise<DashboardPageData> {
  const [stats, traffic] = await Promise.all([
    getDashboardStats(),
    getGa4TrafficSummary(),
  ]);

  return { stats, traffic };
}

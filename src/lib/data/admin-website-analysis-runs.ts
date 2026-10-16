import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import {
  toAdminWebsiteCheckRunDetail,
} from "@/lib/admin/website-check/admin-run-mapper";
import {
  adminWebsiteCheckOverallDisplay,
  adminWebsiteCheckStatusLabel,
  buildAdminWebsiteCheckRunFilter,
  type AdminWebsiteCheckListQuery,
} from "@/lib/admin/website-check/list-query";
import { getWebsiteAnalysisRunById } from "@/lib/data/website-analysis-runs";
import type { WebsiteAnalysisRunStatus } from "@/types/website-analysis-run";
import { WebsiteAnalysisRun } from "@/models/WebsiteAnalysisRun";
import type {
  AdminWebsiteCheckRunDetail,
  AdminWebsiteCheckRunListResult,
  AdminWebsiteCheckRunSummary,
} from "@/types/admin-website-check-run";

type LeanRunListRow = {
  _id: mongoose.Types.ObjectId;
  urlNormalized: string;
  status: string;
  scores?: {
    overall?: number | null;
  };
  leadId?: mongoose.Types.ObjectId;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export async function getAdminWebsiteCheckRunSummary(): Promise<AdminWebsiteCheckRunSummary> {
  await connectDB();

  const [totalRuns, uniqueAgg, leadsSubmitted] = await Promise.all([
    WebsiteAnalysisRun.countDocuments({}),
    WebsiteAnalysisRun.aggregate<{ count: number }>([
      { $group: { _id: "$urlHash" } },
      { $count: "count" },
    ]),
    WebsiteAnalysisRun.countDocuments({ leadId: { $exists: true, $ne: null } }),
  ]);

  return {
    totalRuns,
    uniqueWebsites: uniqueAgg[0]?.count ?? 0,
    leadsSubmitted,
  };
}

export async function getAdminWebsiteCheckRunList(
  query: AdminWebsiteCheckListQuery
): Promise<AdminWebsiteCheckRunListResult> {
  await connectDB();

  const filter = buildAdminWebsiteCheckRunFilter(query);
  const skip = (query.page - 1) * query.pageSize;

  const [rows, totalItems] = await Promise.all([
    WebsiteAnalysisRun.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.pageSize)
      .select(
        "urlNormalized status scores.overall leadId completedAt createdAt updatedAt"
      )
      .lean<LeanRunListRow[]>(),
    WebsiteAnalysisRun.countDocuments(filter),
  ]);

  const items = rows.map((row) => {
    const status = row.status as WebsiteAnalysisRunStatus;
    const overall = row.scores?.overall ?? null;
    const analyzedAt = (row.completedAt ?? row.createdAt).toISOString();
    return {
      id: row._id.toString(),
      url: row.urlNormalized,
      overallScore: overall,
      overallDisplay: adminWebsiteCheckOverallDisplay(status, overall),
      analyzedAt,
      status,
      statusLabel: adminWebsiteCheckStatusLabel(status),
      hasLead: Boolean(row.leadId),
    };
  });

  return {
    items,
    page: query.page,
    pageSize: query.pageSize,
    totalItems,
    totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / query.pageSize),
  };
}

export async function getAdminWebsiteCheckRunDetail(
  id: string
): Promise<AdminWebsiteCheckRunDetail | null> {
  const run = await getWebsiteAnalysisRunById(id);
  if (!run) {
    return null;
  }
  return toAdminWebsiteCheckRunDetail(run);
}

import { z } from "zod";
import type { WebsiteAnalysisRunStatus } from "@/types/website-analysis-run";

export const DEFAULT_ADMIN_WEBSITE_CHECK_PAGE_SIZE = 20;
export const MAX_ADMIN_WEBSITE_CHECK_PAGE_SIZE = 50;

const TERMINAL_STATUSES = ["completed", "partial", "failed"] as const;
const IN_PROGRESS_STATUSES = ["queued", "running"] as const;

export type AdminWebsiteCheckStatusFilter =
  | "all"
  | "completed"
  | "partial"
  | "failed"
  | "in_progress";

export type AdminWebsiteCheckLeadFilter = "all" | "yes" | "no";

export const adminWebsiteCheckListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_ADMIN_WEBSITE_CHECK_PAGE_SIZE).default(
    DEFAULT_ADMIN_WEBSITE_CHECK_PAGE_SIZE
  ),
  q: z.string().trim().max(256).optional(),
  status: z
    .enum(["all", "completed", "partial", "failed", "in_progress"])
    .default("all"),
  hasLead: z.enum(["all", "yes", "no"]).default("all"),
});

export type AdminWebsiteCheckListQuery = z.infer<typeof adminWebsiteCheckListQuerySchema>;

export function parseAdminWebsiteCheckListQuery(
  searchParams: Record<string, string | undefined>
): AdminWebsiteCheckListQuery {
  return adminWebsiteCheckListQuerySchema.parse({
    page: searchParams.page,
    pageSize: searchParams.pageSize,
    q: searchParams.q,
    status: searchParams.status,
    hasLead: searchParams.hasLead,
  });
}

export function escapeMongoRegexLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildAdminWebsiteCheckRunFilter(
  query: AdminWebsiteCheckListQuery
): Record<string, unknown> {
  const filter: Record<string, unknown> = {};

  if (query.status === "in_progress") {
    filter.status = { $in: [...IN_PROGRESS_STATUSES] as WebsiteAnalysisRunStatus[] };
  } else if (query.status !== "all") {
    filter.status = query.status;
  }

  if (query.hasLead === "yes") {
    filter.leadId = { $exists: true, $ne: null };
  } else if (query.hasLead === "no") {
    filter.$or = [{ leadId: { $exists: false } }, { leadId: null }];
  }

  const search = query.q?.trim();
  if (search) {
    filter.urlNormalized = {
      $regex: escapeMongoRegexLiteral(search),
      $options: "i",
    };
  }

  return filter;
}

export function adminWebsiteCheckStatusLabel(status: WebsiteAnalysisRunStatus): string {
  switch (status) {
    case "queued":
    case "running":
      return "בבדיקה";
    case "failed":
      return "נכשל";
    case "partial":
      return "הושלם חלקית";
    case "completed":
      return "הושלם";
    default:
      return status;
  }
}

export function adminWebsiteCheckOverallDisplay(
  status: WebsiteAnalysisRunStatus,
  overall: number | null
): string {
  if (status === "failed") {
    return "נכשל";
  }
  if (status === "queued" || status === "running") {
    return "בבדיקה";
  }
  if (overall === null || overall === undefined) {
    return "לא זמין";
  }
  return String(overall);
}

export function isTerminalWebsiteCheckStatus(
  status: WebsiteAnalysisRunStatus
): status is (typeof TERMINAL_STATUSES)[number] {
  return (TERMINAL_STATUSES as readonly string[]).includes(status);
}

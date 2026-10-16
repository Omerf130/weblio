import type {
  AdminWebsiteCheckLeadFilter,
  AdminWebsiteCheckStatusFilter,
} from "@/lib/admin/website-check/list-query";

export function buildAdminWebsiteCheckListHref(options: {
  page?: number;
  status?: AdminWebsiteCheckStatusFilter;
  hasLead?: AdminWebsiteCheckLeadFilter;
  q?: string;
}): string {
  const params = new URLSearchParams();
  if (options.status && options.status !== "all") {
    params.set("status", options.status);
  }
  if (options.hasLead && options.hasLead !== "all") {
    params.set("hasLead", options.hasLead);
  }
  if (options.q?.trim()) {
    params.set("q", options.q.trim());
  }
  if (options.page && options.page > 1) {
    params.set("page", String(options.page));
  }
  const query = params.toString();
  return query ? `/admin/website-check?${query}` : "/admin/website-check";
}

export function parseAdminWebsiteCheckStatusFilter(
  value?: string
): AdminWebsiteCheckStatusFilter {
  const allowed: AdminWebsiteCheckStatusFilter[] = [
    "all",
    "completed",
    "partial",
    "failed",
    "in_progress",
  ];
  if (value && (allowed as string[]).includes(value)) {
    return value as AdminWebsiteCheckStatusFilter;
  }
  return "all";
}

export function parseAdminWebsiteCheckLeadFilter(value?: string): AdminWebsiteCheckLeadFilter {
  const allowed: AdminWebsiteCheckLeadFilter[] = ["all", "yes", "no"];
  if (value && (allowed as string[]).includes(value)) {
    return value as AdminWebsiteCheckLeadFilter;
  }
  return "all";
}

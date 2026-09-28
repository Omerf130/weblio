import type {
  OpportunityClassification,
  OpportunitySource,
  OpportunityStatus,
} from "@/types/opportunity";

export type OpportunityStatusFilter = "all" | OpportunityStatus;

export type OpportunityClassificationFilter = "all" | OpportunityClassification;

export type OpportunitySourceFilter = "all" | OpportunitySource;

export type OpportunityListSearchParams = {
  status?: string;
  classification?: string;
  source?: string;
  q?: string;
  page?: string;
};

export function parseOpportunityStatusFilter(
  value?: string
): OpportunityStatusFilter {
  const allowed: OpportunityStatusFilter[] = [
    "all",
    "new",
    "researching",
    "contacted",
    "converted",
    "dismissed",
  ];
  if (value && (allowed as string[]).includes(value)) {
    return value as OpportunityStatusFilter;
  }
  return "all";
}

export function parseOpportunityClassificationFilter(
  value?: string
): OpportunityClassificationFilter {
  const allowed: OpportunityClassificationFilter[] = [
    "all",
    "explicitNeed",
    "possibleNeed",
    "businessDiscovery",
  ];
  if (value && (allowed as string[]).includes(value)) {
    return value as OpportunityClassificationFilter;
  }
  return "all";
}

export function parseOpportunitySourceFilter(value?: string): OpportunitySourceFilter {
  const allowed: OpportunitySourceFilter[] = [
    "all",
    "manual",
    "intent",
    "businessDiscovery",
    "referral",
    "other",
  ];
  if (value && (allowed as string[]).includes(value)) {
    return value as OpportunitySourceFilter;
  }
  return "all";
}

export function buildOpportunityListHref(options: {
  status?: OpportunityStatusFilter;
  classification?: OpportunityClassificationFilter;
  source?: OpportunitySourceFilter;
  q?: string;
  page?: number;
}): string {
  const params = new URLSearchParams();

  if (options.status && options.status !== "all") {
    params.set("status", options.status);
  }
  if (options.classification && options.classification !== "all") {
    params.set("classification", options.classification);
  }
  if (options.source && options.source !== "all") {
    params.set("source", options.source);
  }
  const q = options.q?.trim();
  if (q) {
    params.set("q", q);
  }
  if (options.page && options.page > 1) {
    params.set("page", String(options.page));
  }

  const query = params.toString();
  return query
    ? `/admin/business/opportunities?${query}`
    : "/admin/business/opportunities";
}

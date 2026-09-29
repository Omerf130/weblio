import type { IntentClassification, IntentStatus } from "@/types/intent";
import type { IntentListOptions } from "@/types/intent";

export type IntentStatusFilter = "all" | IntentStatus;

/** `inbox` = new-work queue excluding irrelevant (UI default, not a stored classification). */
export type IntentClassificationFilter = "all" | "inbox" | IntentClassification;

export type IntentProviderFilter = "all" | string;

export type IntentListSearchParams = {
  status?: string;
  classification?: string;
  provider?: string;
  q?: string;
  page?: string;
};

export function parseIntentStatusFilter(value?: string): IntentStatusFilter {
  const allowed: IntentStatusFilter[] = ["all", "new", "dismissed", "saved"];
  if (value && (allowed as string[]).includes(value)) {
    return value as IntentStatusFilter;
  }
  return "all";
}

export function parseIntentClassificationFilter(
  value?: string
): IntentClassificationFilter {
  const allowed: IntentClassificationFilter[] = [
    "all",
    "inbox",
    "unclassified",
    "explicitNeed",
    "possibleNeed",
    "irrelevant",
  ];
  if (value && (allowed as string[]).includes(value)) {
    return value as IntentClassificationFilter;
  }
  return "all";
}

export function resolveIntentMonitorFilters(searchParams: {
  status?: string;
  classification?: string;
}): {
  status: IntentStatusFilter;
  classification: IntentClassificationFilter;
} {
  return {
    status: searchParams.status
      ? parseIntentStatusFilter(searchParams.status)
      : "new",
    classification: searchParams.classification
      ? parseIntentClassificationFilter(searchParams.classification)
      : "inbox",
  };
}

const INBOX_CLASSIFICATIONS: IntentClassification[] = [
  "unclassified",
  "explicitNeed",
  "possibleNeed",
];

export function mapIntentFiltersToListOptions(options: {
  status: IntentStatusFilter;
  classification: IntentClassificationFilter;
  provider?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}): IntentListOptions {
  const listOptions: IntentListOptions = {
    page: options.page,
    pageSize: options.pageSize,
    q: options.q,
  };

  if (options.status !== "all") {
    listOptions.status = options.status;
  }

  if (options.provider && options.provider !== "all") {
    listOptions.provider = options.provider;
  }

  if (options.classification === "inbox") {
    listOptions.classifications = INBOX_CLASSIFICATIONS;
  } else if (options.classification !== "all") {
    listOptions.classification = options.classification;
  }

  return listOptions;
}

export function parseIntentProviderFilter(value?: string): IntentProviderFilter {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "all") {
    return "all";
  }
  if (trimmed.length > 40) {
    return "all";
  }
  return trimmed.toLowerCase();
}

export function parseIntentListPage(value?: string): number {
  const page = Number(value);
  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }
  return Math.floor(page);
}

export function buildIntentListHref(options: {
  status?: IntentStatusFilter;
  classification?: IntentClassificationFilter;
  provider?: IntentProviderFilter;
  q?: string;
  page?: number;
}): string {
  const params = new URLSearchParams();

  if (options.status && options.status !== "all") {
    params.set("status", options.status);
  }
  if (
    options.classification &&
    options.classification !== "all" &&
    options.classification !== "inbox"
  ) {
    params.set("classification", options.classification);
  } else if (options.classification === "inbox") {
    params.set("classification", "inbox");
  }
  if (options.provider && options.provider !== "all") {
    params.set("provider", options.provider);
  }
  const q = options.q?.trim();
  if (q) {
    params.set("q", q);
  }
  if (options.page && options.page > 1) {
    params.set("page", String(options.page));
  }

  const query = params.toString();
  return query ? `/admin/business/intent?${query}` : "/admin/business/intent";
}

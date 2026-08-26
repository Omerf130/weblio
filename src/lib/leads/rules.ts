import type {
  AdminLeadDetailDto,
  AdminLeadDto,
  LeadSource,
  LeadStatus,
} from "@/types/lead";

export type LeadSourceFilter = "all" | LeadSource;

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "חדש",
  contacted: "נוצר קשר",
  inProgress: "בטיפול",
  closed: "נסגר",
  archived: "בארכיון",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  website: "אתר",
  landingPage: "דף נחיתה",
};

export function parseLeadSourceFilter(
  searchParam: string | undefined
): LeadSourceFilter {
  if (searchParam === "website" || searchParam === "landingPage") {
    return searchParam;
  }

  return "all";
}

export function formatLeadNumber(leadNumber: number): string {
  return `ליד #${leadNumber}`;
}

export function matchesLeadSearch(
  lead: Pick<AdminLeadDto, "name" | "phone" | "email" | "leadNumber">,
  query: string
): boolean {
  const trimmed = query.trim();
  if (!trimmed) {
    return true;
  }

  const normalized = trimmed.toLowerCase();

  if (
    lead.name.toLowerCase().includes(normalized) ||
    lead.phone.toLowerCase().includes(normalized) ||
    lead.email.toLowerCase().includes(normalized)
  ) {
    return true;
  }

  const digitsOnly = trimmed.replace(/\D/g, "");
  if (digitsOnly.length > 0) {
    if (lead.phone.replace(/\D/g, "").includes(digitsOnly)) {
      return true;
    }

    if (String(lead.leadNumber).includes(digitsOnly)) {
      return true;
    }
  }

  return false;
}

export function getLeadEmptyStateMessage(sourceFilter: LeadSourceFilter): string {
  switch (sourceFilter) {
    case "website":
      return "עדיין לא התקבלו פניות מהאתר.";
    case "landingPage":
      return "עדיין לא התקבלו פניות מדפי נחיתה.";
    default:
      return "עדיין לא התקבלו פניות.";
  }
}

export function hasUtmData(
  lead: Pick<
    AdminLeadDetailDto,
    "utm_source" | "utm_medium" | "utm_campaign" | "utm_content"
  >
): boolean {
  return Boolean(
    lead.utm_source || lead.utm_medium || lead.utm_campaign || lead.utm_content
  );
}

export function shouldSetLastContactAt(
  status: LeadStatus,
  previousStatus?: LeadStatus
): boolean {
  return status === "contacted" && previousStatus !== "contacted";
}

export const OPPORTUNITY_SOURCES = [
  "manual",
  "intent",
  "businessDiscovery",
  "referral",
  "other",
] as const;

export type OpportunitySource = (typeof OPPORTUNITY_SOURCES)[number];

export const OPPORTUNITY_CLASSIFICATIONS = [
  "explicitNeed",
  "possibleNeed",
  "businessDiscovery",
] as const;

export type OpportunityClassification = (typeof OPPORTUNITY_CLASSIFICATIONS)[number];

export const OPPORTUNITY_STATUSES = [
  "new",
  "researching",
  "contacted",
  "converted",
  "dismissed",
] as const;

export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export type AdminOpportunityDto = {
  id: string;
  title: string;
  businessName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  source: OpportunitySource;
  classification: OpportunityClassification;
  status: OpportunityStatus;
  sourceUrl?: string;
  sourcePlatform?: string;
  createdAt: string;
  updatedAt: string;
  leadId?: string;
};

export type AdminOpportunityDetailDto = AdminOpportunityDto & {
  description?: string;
  relevanceNote?: string;
  internalNotes: string;
  leadId?: string;
  convertedAt?: string;
  externalSourceId?: string;
  intentId?: string;
};

export type OpportunitySummary = {
  id: string;
  title: string;
  businessName?: string;
};

export type OpportunityListOptions = {
  page?: number;
  pageSize?: number;
  status?: OpportunityStatus;
  classification?: OpportunityClassification;
  source?: OpportunitySource;
  q?: string;
  sort?: "createdAt" | "-createdAt" | "updatedAt" | "-updatedAt";
};

export type OpportunityListResult = {
  items: AdminOpportunityDto[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

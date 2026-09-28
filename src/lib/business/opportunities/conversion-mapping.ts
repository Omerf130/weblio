import type { AdminOpportunityDetailDto } from "@/types/opportunity";

export function deriveOpportunityConversionName(
  opportunity: Pick<
    AdminOpportunityDetailDto,
    "contactName" | "businessName" | "title"
  >
): string {
  const contact = opportunity.contactName?.trim();
  if (contact) {
    return contact;
  }
  const business = opportunity.businessName?.trim();
  if (business) {
    return business;
  }
  return opportunity.title.trim();
}

export function buildLeadMessageFromOpportunity(
  opportunity: Pick<
    AdminOpportunityDetailDto,
    "description" | "relevanceNote" | "sourceUrl"
  >
): string | undefined {
  const parts: string[] = [];

  if (opportunity.description?.trim()) {
    parts.push(opportunity.description.trim());
  }
  if (opportunity.relevanceNote?.trim()) {
    parts.push(`למה רלוונטי: ${opportunity.relevanceNote.trim()}`);
  }
  if (opportunity.sourceUrl?.trim()) {
    parts.push(`קישור מקור: ${opportunity.sourceUrl.trim()}`);
  }

  return parts.length > 0 ? parts.join("\n\n") : undefined;
}

export function buildLeadInternalNotesFromOpportunity(
  opportunity: Pick<AdminOpportunityDetailDto, "internalNotes">,
  opportunityId: string
): string {
  const parts: string[] = [];
  if (opportunity.internalNotes?.trim()) {
    parts.push(opportunity.internalNotes.trim());
  }
  parts.push(
    `הליד נוצר מהמרת הזדמנות.\n/admin/business/opportunities/${opportunityId}`
  );
  return parts.join("\n\n");
}

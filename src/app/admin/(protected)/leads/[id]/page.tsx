import { notFound } from "next/navigation";
import LeadDetail from "@/components/admin/leads/LeadDetail";
import { getLeadById, markLeadRead } from "@/lib/data/leads";
import { getFollowUpsForLead } from "@/lib/data/follow-ups";
import { getOpportunitySummaryByLeadId } from "@/lib/data/opportunity-conversion";

type LeadDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function LeadDetailPage({
  params,
  searchParams,
}: LeadDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;

  await markLeadRead(id);

  const lead = await getLeadById(id);
  if (!lead) {
    notFound();
  }

  const [followUps, sourceOpportunity] = await Promise.all([
    getFollowUpsForLead(id),
    lead.source === "opportunity"
      ? getOpportunitySummaryByLeadId(id)
      : Promise.resolve(null),
  ]);

  return (
    <LeadDetail
      lead={lead}
      followUps={followUps}
      sourceOpportunity={sourceOpportunity ?? undefined}
      errorMessage={query.error ? decodeURIComponent(query.error) : undefined}
    />
  );
}

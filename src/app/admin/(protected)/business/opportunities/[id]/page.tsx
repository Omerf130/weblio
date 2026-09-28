import { notFound } from "next/navigation";
import { isValidOpportunityObjectId } from "@/lib/validations/opportunity";
import { getOpportunityById } from "@/lib/data/opportunities";
import { getFollowUpsForOpportunity } from "@/lib/data/follow-ups";
import { getRecentLeadOptions } from "@/lib/data/leads";
import OpportunityDetail from "@/components/admin/business/opportunities/OpportunityDetail";

type OpportunityDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function OpportunityDetailPage({
  params,
  searchParams,
}: OpportunityDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;

  if (!isValidOpportunityObjectId(id)) {
    notFound();
  }

  const opportunity = await getOpportunityById(id);
  if (!opportunity) {
    notFound();
  }

  const [followUps, leadOptions] = await Promise.all([
    getFollowUpsForOpportunity(id),
    getRecentLeadOptions(50),
  ]);

  return (
    <OpportunityDetail
      opportunity={opportunity}
      followUps={followUps}
      leadOptions={leadOptions}
      errorMessage={query.error ? decodeURIComponent(query.error) : undefined}
    />
  );
}

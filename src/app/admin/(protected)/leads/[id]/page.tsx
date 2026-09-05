import { notFound } from "next/navigation";
import LeadDetail from "@/components/admin/leads/LeadDetail";
import { getLeadById, markLeadRead } from "@/lib/data/leads";

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

  return (
    <LeadDetail
      lead={lead}
      errorMessage={query.error ? decodeURIComponent(query.error) : undefined}
    />
  );
}

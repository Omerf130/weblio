import LeadsList from "@/components/admin/leads/LeadsList";
import { getAdminLeads } from "@/lib/data/leads";

type LeadsAdminPageProps = {
  searchParams: Promise<{ source?: string; q?: string; error?: string }>;
};

export default async function LeadsAdminPage({ searchParams }: LeadsAdminPageProps) {
  const params = await searchParams;
  const leads = await getAdminLeads({
    source: params.source,
    q: params.q,
  });

  return (
    <LeadsList
      leads={leads}
      source={params.source}
      query={params.q}
      errorMessage={params.error ? decodeURIComponent(params.error) : undefined}
    />
  );
}

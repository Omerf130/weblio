import { notFound } from "next/navigation";
import WebsiteCheckRunDetail from "@/components/admin/website-check/WebsiteCheckRunDetail";
import { getAdminWebsiteCheckRunDetail } from "@/lib/data/admin-website-analysis-runs";

type WebsiteCheckRunDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function WebsiteCheckRunDetailPage({
  params,
}: WebsiteCheckRunDetailPageProps) {
  const { id } = await params;
  const run = await getAdminWebsiteCheckRunDetail(id);

  if (!run) {
    notFound();
  }

  return <WebsiteCheckRunDetail run={run} />;
}

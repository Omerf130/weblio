import DashboardContent from "@/components/admin/DashboardContent";
import { getDashboardPageData } from "@/lib/data/dashboard";

export default async function AdminDashboardPage() {
  const data = await getDashboardPageData();

  return <DashboardContent data={data} />;
}

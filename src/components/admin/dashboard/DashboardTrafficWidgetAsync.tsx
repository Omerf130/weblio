import { getCachedGa4TrafficSummary } from "@/lib/analytics/ga4-traffic";
import DashboardTrafficWidget from "@/components/admin/dashboard/DashboardTrafficWidget";

export default async function DashboardTrafficWidgetAsync() {
  const traffic = await getCachedGa4TrafficSummary();
  return <DashboardTrafficWidget traffic={traffic} />;
}

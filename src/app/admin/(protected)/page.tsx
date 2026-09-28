import { Suspense } from "react";
import DashboardContent from "@/components/admin/DashboardContent";
import DashboardTrafficWidgetAsync from "@/components/admin/dashboard/DashboardTrafficWidgetAsync";
import DashboardTrafficWidgetLoading from "@/components/admin/dashboard/DashboardTrafficWidgetLoading";
import { getDashboardPageData } from "@/lib/data/dashboard";

export default async function AdminDashboardPage() {
  const { stats } = await getDashboardPageData();

  return (
    <DashboardContent
      stats={stats}
      traffic={
        <Suspense fallback={<DashboardTrafficWidgetLoading />}>
          <DashboardTrafficWidgetAsync />
        </Suspense>
      }
    />
  );
}

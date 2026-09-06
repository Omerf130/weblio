"use client";

import { useAdminUser } from "@/components/admin/AdminUserContext";
import DashboardHeader from "@/components/admin/dashboard/DashboardHeader";
import DashboardKpiCards from "@/components/admin/dashboard/DashboardKpiCards";
import DashboardLandingWidget from "@/components/admin/dashboard/DashboardLandingWidget";
import DashboardLeadSources from "@/components/admin/dashboard/DashboardLeadSources";
import DashboardLeadsChart from "@/components/admin/dashboard/DashboardLeadsChart";
import DashboardQuickActions from "@/components/admin/dashboard/DashboardQuickActions";
import DashboardRecentLeads from "@/components/admin/dashboard/DashboardRecentLeads";
import DashboardRecentProjects from "@/components/admin/dashboard/DashboardRecentProjects";
import DashboardTrafficWidget from "@/components/admin/dashboard/DashboardTrafficWidget";
import type { DashboardPageData } from "@/types/dashboard";
import styles from "./DashboardContent.module.scss";

type DashboardContentProps = {
  data: DashboardPageData;
};

export default function DashboardContent({ data }: DashboardContentProps) {
  const admin = useAdminUser();

  return (
    <div className={styles.dashboard}>
      <DashboardHeader adminName={admin.name} />
      <DashboardKpiCards stats={data.stats} />

      <div className={styles.analyticsRow}>
        <DashboardLeadsChart data={data.stats.dailyLeads} />
        <DashboardTrafficWidget traffic={data.traffic} />
      </div>

      <DashboardRecentLeads leads={data.stats.recentLeads} />

      <div className={styles.secondaryRow}>
        <DashboardLeadSources sources={data.stats.sourceBreakdown} />
        <DashboardRecentProjects projects={data.stats.recentProjects} />
      </div>

      <div className={styles.bottomRow}>
        <DashboardLandingWidget landing={data.stats.landing} />
        <DashboardQuickActions />
      </div>
    </div>
  );
}

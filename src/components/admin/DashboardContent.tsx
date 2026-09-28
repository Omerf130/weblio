"use client";

import type { ReactNode } from "react";
import { useAdminUser } from "@/components/admin/AdminUserContext";
import DashboardHeader from "@/components/admin/dashboard/DashboardHeader";
import DashboardKpiCards from "@/components/admin/dashboard/DashboardKpiCards";
import DashboardLandingWidget from "@/components/admin/dashboard/DashboardLandingWidget";
import DashboardLeadSources from "@/components/admin/dashboard/DashboardLeadSources";
import DashboardLeadsChart from "@/components/admin/dashboard/DashboardLeadsChart";
import DashboardQuickActions from "@/components/admin/dashboard/DashboardQuickActions";
import DashboardRecentLeads from "@/components/admin/dashboard/DashboardRecentLeads";
import DashboardRecentProjects from "@/components/admin/dashboard/DashboardRecentProjects";
import type { DashboardStats } from "@/types/dashboard";
import styles from "./DashboardContent.module.scss";

type DashboardContentProps = {
  stats: DashboardStats;
  traffic: ReactNode;
};

export default function DashboardContent({ stats, traffic }: DashboardContentProps) {
  const admin = useAdminUser();

  return (
    <div className={styles.dashboard}>
      <DashboardHeader adminName={admin.name} />
      <DashboardKpiCards stats={stats} />

      <div className={styles.analyticsRow}>
        <DashboardLeadsChart data={stats.dailyLeads} />
        {traffic}
      </div>

      <DashboardRecentLeads leads={stats.recentLeads} />

      <div className={styles.secondaryRow}>
        <DashboardLeadSources sources={stats.sourceBreakdown} />
        <DashboardRecentProjects projects={stats.recentProjects} />
      </div>

      <div className={styles.bottomRow}>
        <DashboardLandingWidget landing={stats.landing} />
        <DashboardQuickActions />
      </div>
    </div>
  );
}

import type { BusinessOverviewDashboardData } from "@/types/business";
import type { OpportunitySummary } from "@/types/opportunity";
import BusinessOverviewActivityPanel from "./BusinessOverviewActivityPanel";
import BusinessOverviewDiscoveryPanel from "./BusinessOverviewDiscoveryPanel";
import BusinessOverviewKpiRow from "./BusinessOverviewKpiRow";
import BusinessOverviewLeadsChart from "./BusinessOverviewLeadsChart";
import BusinessOverviewOpportunityStatus from "./BusinessOverviewOpportunityStatus";
import BusinessOverviewRecentIntents from "./BusinessOverviewRecentIntents";
import styles from "./BusinessOverview.module.scss";

type Props = {
  data: BusinessOverviewDashboardData;
  leadSummaries: Map<string, { id: string; leadNumber: number; name: string }>;
  opportunitySummaries: Map<string, OpportunitySummary>;
};

export default function BusinessOverviewDashboard({
  data,
  leadSummaries,
  opportunitySummaries,
}: Props) {
  return (
    <div className={styles.dashboardCanvas}>
      <div className={styles.dashboard}>
        <header className={styles.header}>
        <h1 className={styles.heading}>סקירה עסקית</h1>
        <p className={styles.subtitle}>
          מרכז תפעולי ללידים, הזדמנויות, מעקבים ו-Discovery
        </p>
        </header>

        <BusinessOverviewKpiRow kpis={data.kpis} />

        <div className={styles.row2}>
          <BusinessOverviewActivityPanel
            activity={data.activity}
            leadSummaries={leadSummaries}
            opportunitySummaries={opportunitySummaries}
          />
          <BusinessOverviewLeadsChart data={data.dailyLeads7Days} />
          <BusinessOverviewOpportunityStatus counts={data.opportunityStatusCounts} />
        </div>

        <div className={styles.row3}>
          <BusinessOverviewRecentIntents intents={data.recentClassifiedIntents} />
          <BusinessOverviewDiscoveryPanel discovery={data.discovery} />
        </div>
      </div>
    </div>
  );
}

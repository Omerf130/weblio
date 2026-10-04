import { connectDB } from "@/lib/db/mongoose";
import { getIsraelMonthStart } from "@/lib/admin/dashboard-time";
import { getIsraelCalendarDateKey } from "@/lib/admin/israel-calendar-date";
import { getDiscoveryCreditConfig } from "@/lib/discovery/discovery-credit-env";
import { estimateTavilyCreditsForRun } from "@/lib/discovery/discovery-run-credits";
import { DiscoveryRun } from "@/models/DiscoveryRun";

export type DiscoveryMonthlyCreditUsage = {
  monthKey: string;
  estimatedCreditsUsed: number;
  runCountWithSpend: number;
  softWarnReached: boolean;
  hardStopReached: boolean;
  hardStopLimit: number;
  softWarnLimit: number;
};

function israelMonthKey(reference: Date): string {
  return getIsraelCalendarDateKey(reference).slice(0, 7);
}

export async function getDiscoveryMonthlyCreditUsage(input?: {
  referenceDate?: Date;
  creditConfig?: ReturnType<typeof getDiscoveryCreditConfig>;
}): Promise<DiscoveryMonthlyCreditUsage> {
  await connectDB();
  const referenceDate = input?.referenceDate ?? new Date();
  const creditConfig = input?.creditConfig ?? getDiscoveryCreditConfig();
  const monthStart = getIsraelMonthStart(referenceDate);
  const monthKey = israelMonthKey(referenceDate);

  const docs = await DiscoveryRun.find({
    completedAt: { $gte: monthStart, $lte: referenceDate },
    status: { $in: ["completed", "partial", "failed"] },
  })
    .select({
      estimatedTavilyCredits: 1,
      tavilyHttpAttempts: 1,
      tavilyRequests: 1,
      status: 1,
    })
    .lean();

  let estimatedCreditsUsed = 0;
  let runCountWithSpend = 0;

  for (const doc of docs) {
    const credits = estimateTavilyCreditsForRun({
      estimatedTavilyCredits: doc.estimatedTavilyCredits ?? undefined,
      tavilyHttpAttempts: doc.tavilyHttpAttempts ?? undefined,
      tavilyRequests: doc.tavilyRequests ?? undefined,
    });
    if (credits <= 0) {
      continue;
    }
    estimatedCreditsUsed += credits;
    runCountWithSpend += 1;
  }

  return {
    monthKey,
    estimatedCreditsUsed,
    runCountWithSpend,
    softWarnReached: estimatedCreditsUsed >= creditConfig.monthlySoftWarn,
    hardStopReached: estimatedCreditsUsed >= creditConfig.monthlyHardStop,
    hardStopLimit: creditConfig.monthlyHardStop,
    softWarnLimit: creditConfig.monthlySoftWarn,
  };
}

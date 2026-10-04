import type { DiscoveryCreditConfig } from "@/lib/discovery/discovery-credit-env";
import { worstCaseTavilyHttpAttempts } from "@/lib/discovery/discovery-planned-profiles";

export type CreditPreflightResult =
  | {
      ok: true;
      plannedProfileCount: number;
      reservedHttpAttempts: number;
      monthCreditsUsed: number;
      hardStop: number;
      softWarnReached: boolean;
    }
  | {
      ok: false;
      reason: "credit_limit";
      plannedProfileCount: number;
      reservedHttpAttempts: number;
      monthCreditsUsed: number;
      hardStop: number;
    };

export function wouldExceedMonthlyHardStop(input: {
  monthCreditsUsed: number;
  reservedHttpAttempts: number;
  hardStop: number;
}): boolean {
  return input.monthCreditsUsed + input.reservedHttpAttempts > input.hardStop;
}

export function evaluateCreditPreflight(input: {
  monthCreditsUsed: number;
  plannedProfileCount: number;
  creditConfig: DiscoveryCreditConfig;
}): CreditPreflightResult {
  const reservedHttpAttempts = worstCaseTavilyHttpAttempts(input.plannedProfileCount);
  const hardStop = input.creditConfig.monthlyHardStop;
  const softWarnReached =
    input.monthCreditsUsed + reservedHttpAttempts >= input.creditConfig.monthlySoftWarn;

  if (
    wouldExceedMonthlyHardStop({
      monthCreditsUsed: input.monthCreditsUsed,
      reservedHttpAttempts,
      hardStop,
    })
  ) {
    return {
      ok: false,
      reason: "credit_limit",
      plannedProfileCount: input.plannedProfileCount,
      reservedHttpAttempts,
      monthCreditsUsed: input.monthCreditsUsed,
      hardStop,
    };
  }

  return {
    ok: true,
    plannedProfileCount: input.plannedProfileCount,
    reservedHttpAttempts,
    monthCreditsUsed: input.monthCreditsUsed,
    hardStop,
    softWarnReached,
  };
}

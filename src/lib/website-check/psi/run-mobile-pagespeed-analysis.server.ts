import "server-only";

import {
  assembleMobilePageSpeedAnalysisFailure,
  assembleMobilePageSpeedAnalysisFromPayload,
  type MobilePageSpeedAnalysisResult,
} from "./assemble-mobile-analysis";
import {
  fetchMobilePageSpeedInsightsFromEnv,
  type FetchMobilePageSpeedFromEnvOptions,
} from "./pagespeed-client.server";

export type RunMobilePageSpeedAnalysisOptions = Omit<
  FetchMobilePageSpeedFromEnvOptions,
  "fetchImpl"
> & {
  fetchImpl?: FetchMobilePageSpeedFromEnvOptions["fetchImpl"];
};

/**
 * Runs a mobile PSI analysis using server env configuration.
 * Not wired to public routes yet — for jobs/API in later checkpoints.
 */
export async function runMobilePageSpeedAnalysis(
  options: RunMobilePageSpeedAnalysisOptions
): Promise<MobilePageSpeedAnalysisResult> {
  const fetchResult = await fetchMobilePageSpeedInsightsFromEnv(options);

  if (!fetchResult.ok) {
    return assembleMobilePageSpeedAnalysisFailure(fetchResult);
  }

  return assembleMobilePageSpeedAnalysisFromPayload(fetchResult.data);
}

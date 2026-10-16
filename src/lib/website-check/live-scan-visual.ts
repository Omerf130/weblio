import {
  buildWebsiteCheckCachedResultsPublicMessage,
  WEBSITE_CHECK_CACHE_REPLAY_STATUS_LABEL,
} from "@/lib/website-check/cached-results-public-message";
import { normalizeWebsiteCheckPublicCopy } from "@/lib/website-check/normalize-public-copy";
import type { PublicWebsiteAnalysisRunDto } from "@/lib/website-check/public-run-dto";
import type { WebsiteAnalysisRunStatus } from "@/types/website-analysis-run";
import {
  SCAN_DEMO_STAGE_COUNT,
  type ScanDemoStageVisualStatus,
} from "@/lib/website-check/scan-demo-sequence";



export type LiveScanVisualState = {

  stageStatuses: ScanDemoStageVisualStatus[];

  statusLabel: string;

  activityLine: string;

  isComplete: boolean;

  isFailed: boolean;

  indeterminateProgress: boolean;

  /** Not used for width animation in live mode — beam stays indeterminate until complete */

  timelineBeamProgress: number;

};



export function isTerminalAnalysisStatus(status: WebsiteAnalysisRunStatus): boolean {

  return status === "completed" || status === "partial" || status === "failed";

}



/** Single active stage index while running; null = none highlighted. */

export function liveActiveStageIndexForRun(run: PublicWebsiteAnalysisRunDto): number | null {

  if (run.status === "completed" || run.status === "partial" || run.status === "failed") {

    return null;

  }



  if (run.status === "queued") {

    return 0;

  }



  switch (run.phase) {

    case "queued":

      return 0;

    case "psi_mobile":

      return 0;

    case "psi_desktop":

      return 1;

    case "scoring":

      return SCAN_DEMO_STAGE_COUNT - 1;

    case "done":

      return null;

    default:

      return run.status === "running" ? 0 : null;

  }

}



function buildLiveStageStatuses(run: PublicWebsiteAnalysisRunDto): ScanDemoStageVisualStatus[] {

  const terminalSuccess = run.status === "completed" || run.status === "partial";

  if (terminalSuccess) {

    return Array.from({ length: SCAN_DEMO_STAGE_COUNT }, () => "completed");

  }



  const activeIndex = liveActiveStageIndexForRun(run);

  return Array.from({ length: SCAN_DEMO_STAGE_COUNT }, (_, index) => {

    if (activeIndex === null) {

      return "pending";

    }

    if (index === activeIndex) {

      return "active";

    }

    return "pending";

  });

}



function statusLabelForRun(run: PublicWebsiteAnalysisRunDto): string {

  if (run.status === "failed") {

    return "הניתוח נכשל";

  }



  if (run.cacheHit && (run.status === "completed" || run.status === "partial")) {
    return WEBSITE_CHECK_CACHE_REPLAY_STATUS_LABEL;
  }

  if (run.status === "completed") {

    return "הניתוח הושלם";

  }



  if (run.status === "partial") {

    return "הניתוח הושלם חלקית";

  }



  if (run.status === "queued") {

    return "ממתינים בתור לניתוח…";

  }



  if (run.phase === "psi_mobile") {

    return "מריצים ניתוח PageSpeed (mobile)…";

  }



  if (run.phase === "scoring") {

    return "מסכמים תוצאות…";

  }



  return "מבצעים ניתוח…";

}



function activityLineForRun(run: PublicWebsiteAnalysisRunDto): string {

  if (run.status === "failed") {

    return normalizeWebsiteCheckPublicCopy(
      run.error?.messagePublic ?? "לא הצלחנו להשלים את הניתוח."
    );

  }



  if (run.cacheHit && (run.status === "completed" || run.status === "partial")) {
    return buildWebsiteCheckCachedResultsPublicMessage(run.completedAt);
  }

  if (run.status === "completed" || run.status === "partial") {

    return "הניתוח הסתיים. ניתן לצפות בדוח האמיתי.";

  }



  if (run.phase === "psi_mobile") {

    return "Google PageSpeed Insights (mobile) - שלב ניתוח יחיד; אין מעבר אוטומטי בין האייקונים.";

  }



  return "השרת מעדכן את סטטוס הניתוח. אין הצגת אחוזים מדומה.";

}



export function getLiveScanVisualState(run: PublicWebsiteAnalysisRunDto | null): LiveScanVisualState {

  if (!run) {

    return {

      stageStatuses: Array.from({ length: SCAN_DEMO_STAGE_COUNT }, () => "pending"),

      statusLabel: "מתחילים ניתוח…",

      activityLine: "ממתינים לתשובה מהשרת…",

      isComplete: false,

      isFailed: false,

      indeterminateProgress: true,

      timelineBeamProgress: 0,

    };

  }



  const failed = run.status === "failed";

  const complete = run.status === "completed" || run.status === "partial";



  return {

    stageStatuses: buildLiveStageStatuses(run),

    statusLabel: statusLabelForRun(run),

    activityLine: activityLineForRun(run),

    isComplete: complete,

    isFailed: failed,

    indeterminateProgress: !complete && !failed,

    timelineBeamProgress: complete ? 100 : 0,

  };

}



/** Minimal PSI v5 shapes used by the parser (not exhaustive). */

export type PsiAuditRef = {
  id: string;
  weight?: number;
  group?: string;
};

export type PsiCategory = {
  id?: string;
  title?: string;
  score?: number | null;
  auditRefs?: PsiAuditRef[];
};

export type PsiAudit = {
  id?: string;
  title?: string;
  description?: string;
  score?: number | null;
  scoreDisplayMode?: string;
  displayValue?: string;
  numericValue?: number;
  details?: {
    type?: string;
    overallSavingsMs?: number;
  };
};

export type PsiLoadingExperienceMetrics = Record<
  string,
  {
    percentile?: number;
    category?: string;
  }
>;

export type PsiLoadingExperience = {
  metrics?: PsiLoadingExperienceMetrics;
  overall_category?: string;
};

export type PsiLighthouseResult = {
  lighthouseVersion?: string;
  finalUrl?: string;
  fetchTime?: string;
  categories?: Record<string, PsiCategory>;
  audits?: Record<string, PsiAudit>;
  runtimeError?: {
    code?: string;
    message?: string;
  };
};

export type PsiPageSpeedResponse = {
  id?: string;
  lighthouseResult?: PsiLighthouseResult;
  loadingExperience?: PsiLoadingExperience;
  originLoadingExperience?: PsiLoadingExperience;
  analysisUTCTimestamp?: string;
};

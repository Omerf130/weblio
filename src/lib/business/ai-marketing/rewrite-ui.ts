import type { RewriteTransformation } from "@/lib/business/ai-marketing/types";

export type RewriteTransformationOption = {
  value: RewriteTransformation;
  label: string;
};

export const REWRITE_TRANSFORMATION_OPTIONS: RewriteTransformationOption[] = [
  { value: "shorter", label: "קצר יותר" },
  { value: "morePersonal", label: "יותר אישי" },
  { value: "moreProfessional", label: "יותר מקצועי" },
  { value: "strongerCta", label: "CTA טוב יותר" },
  { value: "clearer", label: "ברור יותר" },
  { value: "fullRewrite", label: "שכתוב מלא" },
];

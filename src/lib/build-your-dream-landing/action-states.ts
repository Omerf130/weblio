import type { BuildYourDreamContent } from "@/lib/content/build-your-dream/types";

export type BuildYourDreamLandingActionState = {
  error?: string;
  success?: boolean;
  savedAt?: string;
  content?: BuildYourDreamContent;
};

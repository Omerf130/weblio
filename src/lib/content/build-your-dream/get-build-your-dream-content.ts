import { STATIC_BUILD_YOUR_DREAM_CONTENT } from "./static-content";
import type { BuildYourDreamContent } from "./types";
import { getBuildYourDreamLandingDocument } from "@/lib/data/build-your-dream-landing";

export async function getBuildYourDreamContent(): Promise<BuildYourDreamContent> {
  try {
    const doc = await getBuildYourDreamLandingDocument();
    if (doc) {
      return doc;
    }
  } catch {
    // Mongo unavailable or not configured — fall back to static content.
  }

  return STATIC_BUILD_YOUR_DREAM_CONTENT;
}

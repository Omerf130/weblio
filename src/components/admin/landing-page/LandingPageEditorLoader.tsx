"use client";

import dynamic from "next/dynamic";
import type { BuildYourDreamContent } from "@/lib/content/build-your-dream/types";

const LandingPageEditor = dynamic(
  () => import("@/components/admin/landing-page/LandingPageEditor"),
  {
    ssr: false,
    loading: () => <p>טוען עורך...</p>,
  }
);

type LandingPageEditorLoaderProps = {
  initialContent: BuildYourDreamContent;
  lastSavedAt: string | null;
  isPersisted: boolean;
};

export default function LandingPageEditorLoader(props: LandingPageEditorLoaderProps) {
  return <LandingPageEditor {...props} />;
}

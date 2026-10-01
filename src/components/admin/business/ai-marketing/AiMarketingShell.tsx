"use client";

import { useState } from "react";
import type { AiMarketingProjectPickerOption } from "@/lib/business/ai-marketing/project-picker-options";
import type { HubMarketingPurpose } from "@/lib/business/ai-marketing/types";
import AiMarketingContentTool from "./AiMarketingContentTool";
import AiMarketingHub from "./AiMarketingHub";
import AiMarketingWebsiteTool from "./AiMarketingWebsiteTool";

type AiMarketingShellProps = {
  projects: AiMarketingProjectPickerOption[];
};

export default function AiMarketingShell({ projects }: AiMarketingShellProps) {
  const [selectedPurpose, setSelectedPurpose] =
    useState<HubMarketingPurpose | null>(null);

  if (selectedPurpose === "websiteProjectContent") {
    return (
      <AiMarketingWebsiteTool
        projects={projects}
        onBack={() => setSelectedPurpose(null)}
      />
    );
  }

  if (
    selectedPurpose === "socialPost" ||
    selectedPurpose === "linkedinPost" ||
    selectedPurpose === "story"
  ) {
    return (
      <AiMarketingContentTool
        purpose={selectedPurpose}
        projects={projects}
        onBack={() => setSelectedPurpose(null)}
      />
    );
  }

  return (
    <AiMarketingHub onSelectPurpose={(purpose) => setSelectedPurpose(purpose)} />
  );
}

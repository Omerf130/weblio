"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import Footer from "@/components/footer/Footer";
import ProjectsNav from "@/components/projectsNav/ProjectsNav";
import { useWebsiteCheckConfig } from "@/lib/website-check/useWebsiteCheckConfig";
import { useWebsiteCheckFlow } from "@/lib/website-check/useWebsiteCheckFlow";
import EntryScreen from "./screens/EntryScreen";
import ResultsScreen from "./screens/ResultsScreen";
import ScanningScreen from "./screens/ScanningScreen";
import "./WebsiteCheckPage.scss";

export default function WebsiteCheckPage() {
  const prefersReducedMotion = useReducedMotion();
  const config = useWebsiteCheckConfig();
  const {
    phase,
    url,
    flowMode,
    runId,
    analysisRun,
    submitUrl,
    resetToEntry,
    goToResults,
    setAnalysisRun,
    liveAvailable,
  } = useWebsiteCheckFlow(config.liveAvailable);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }, [phase, prefersReducedMotion]);

  const effectiveFlowMode = flowMode ?? (liveAvailable ? "live" : "demo");

  return (
    <div className="website-check-page" dir="rtl" lang="he">
      <div className="website-check-page__atmosphere" aria-hidden>
        <div className="website-check-page__vignette" />
        <span className="website-check-page__glow website-check-page__glow--top" />
        <span className="website-check-page__glow website-check-page__glow--laptop" />
        <span className="website-check-page__glow website-check-page__glow--violet" />
        <span className="website-check-page__glow website-check-page__glow--bottom" />
        <span className="website-check-page__beam website-check-page__beam--left" />
        <span className="website-check-page__beam website-check-page__beam--right" />
        <div className="website-check-page__particles" />
        <div className="website-check-page__grid" />
      </div>

      <ProjectsNav />

      <main
        className={`website-check-page__main${phase === "scanning" ? " website-check-page__main--scanning" : ""}`}
      >
        {phase === "entry" ? (
          <EntryScreen
            liveAvailable={liveAvailable}
            configLoaded={config.loaded}
            onSubmit={submitUrl}
          />
        ) : phase === "scanning" ? (
          <ScanningScreen
            key={`${effectiveFlowMode}-${runId ?? url}`}
            flowMode={effectiveFlowMode}
            url={url}
            runId={runId}
            initialRun={analysisRun}
            onBack={resetToEntry}
            onViewResults={goToResults}
            onRunUpdate={setAnalysisRun}
          />
        ) : phase === "results" && url && flowMode ? (
          <ResultsScreen
            key={flowMode === "live" ? `${runId ?? "live"}-results` : `${url}-demo-results`}
            mode={flowMode}
            url={url}
            analysisRun={flowMode === "live" ? analysisRun : null}
            runId={flowMode === "live" ? runId : null}
            onBack={resetToEntry}
            onRunUpdate={setAnalysisRun}
          />
        ) : null}
      </main>

      <Footer />
    </div>
  );
}

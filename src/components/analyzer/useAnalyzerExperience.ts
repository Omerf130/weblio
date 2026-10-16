"use client";

import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

export function useAnalyzerExperience(sectionInView: boolean) {
  const prefersReducedMotion = useReducedMotion();
  const hasStartedRef = useRef(false);
  const [scanActive, setScanActive] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const [scoresActive, setScoresActive] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      hasStartedRef.current = true;
      setScanComplete(true);
      setCardsRevealed(true);
      setScoresActive(true);
    }
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (!sectionInView || hasStartedRef.current) return;

    hasStartedRef.current = true;
    setScanActive(true);
  }, [sectionInView, prefersReducedMotion]);

  const handleScanComplete = useCallback(() => {
    setScanActive(false);
    setScanComplete(true);
    setCardsRevealed(true);
    setScoresActive(true);
  }, []);

  return {
    scanActive,
    scanComplete,
    cardsRevealed,
    scoresActive,
    prefersReducedMotion: Boolean(prefersReducedMotion),
    handleScanComplete,
  };
}

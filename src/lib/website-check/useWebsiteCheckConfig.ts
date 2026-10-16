"use client";

import { useEffect, useState } from "react";
import { fetchWebsiteCheckConfig } from "@/lib/website-check/client/analysis-api";

export type WebsiteCheckConfigState = {
  liveAvailable: boolean;
  loaded: boolean;
};

export function useWebsiteCheckConfig(): WebsiteCheckConfigState {
  const [state, setState] = useState<WebsiteCheckConfigState>({
    liveAvailable: false,
    loaded: false,
  });

  useEffect(() => {
    let cancelled = false;

    void fetchWebsiteCheckConfig()
      .then((config) => {
        if (!cancelled) {
          setState({ liveAvailable: config.liveAvailable, loaded: true });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ liveAvailable: false, loaded: true });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

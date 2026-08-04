import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackMetaPageView } from "../../utils/metaPixel";

export default function MetaPixelTracker() {
  const location = useLocation();
  const lastTrackedUrl = useRef<string | null>(null);

  useEffect(() => {
    const url = location.pathname + location.search + location.hash;

    if (url === lastTrackedUrl.current) return;

    lastTrackedUrl.current = url;
    trackMetaPageView();
  }, [location.pathname, location.search, location.hash]);

  return null;
}

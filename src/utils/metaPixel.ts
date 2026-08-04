type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  loaded: boolean;
  version: string;
  push: (...args: unknown[]) => void;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

const META_PIXEL_ID = "1461912765743949";

export function initMetaPixel(): void {
  if (window.fbq) return;

  const n = function (...args: unknown[]) {
    if (n.callMethod) {
      n.callMethod(...args);
    } else {
      n.queue.push(args);
    }
  } as Fbq;

  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];

  window.fbq = n;
  if (!window._fbq) window._fbq = n;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  const first = document.getElementsByTagName("script")[0];
  first.parentNode?.insertBefore(script, first);

  window.fbq("init", META_PIXEL_ID);
}

export function trackMetaPageView(): void {
  if (window.fbq) {
    window.fbq("track", "PageView");
  }
}

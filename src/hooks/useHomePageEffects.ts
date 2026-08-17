import { useEffect } from "react";

export function useHomePageEffects(isLoaderDisplay: boolean) {
  useEffect(() => {
    const isFacebookBrowser = () => {
      const ua = navigator.userAgent || navigator.vendor;
      return (
        ua.indexOf("FBAN") > -1 ||
        ua.indexOf("FBAV") > -1 ||
        ua.indexOf("Instagram") > -1
      );
    };

    if (isFacebookBrowser()) {
      document.body.classList.add("fb-browser");
      document.body.style.transform = "translateZ(0)";
    }
  }, []);

  useEffect(() => {
    if (!isLoaderDisplay && window.location.hash) {
      const el = document.querySelector(window.location.hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [isLoaderDisplay]);
}

"use client";

import { useEffect } from "react";
import type { BuildYourDreamContent } from "@/lib/content/build-your-dream/types";
import LandingBenefits from "./components/LandingBenefits";
import LandingCtaBanner from "./components/LandingCtaBanner";
import LandingFaq from "./components/LandingFaq";
import LandingFinalCta from "./components/LandingFinalCta";
import LandingHero from "./components/LandingHero";
import LandingLeadForm, {
  type LandingLeadFormAction,
} from "./components/LandingLeadForm";
import LandingLogo from "./components/LandingLogo";
import LandingProcess from "./components/LandingProcess";
import LandingSplit from "./components/LandingSplit";
import styles from "./BuildYourDreamPage.module.scss";
import "./landing-theme.scss";
import "./landing-shared.scss";

type BuildYourDreamPageProps = {
  content: BuildYourDreamContent;
  leadFormAction: LandingLeadFormAction;
};

export default function BuildYourDreamPage({
  content,
  leadFormAction,
}: BuildYourDreamPageProps) {
  useEffect(() => {
    document.title = content.meta.title;

    const upsertMeta = (key: "name" | "property", attr: string, value: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[${key}="${attr}"]`);
      const created = !el;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(key, attr);
        document.head.appendChild(el);
      }
      const previous = el.getAttribute("content") ?? "";
      el.setAttribute("content", value);
      return { el, previous, created };
    };

    const descriptionMeta = upsertMeta("name", "description", content.meta.description);
    const ogTitle = upsertMeta("property", "og:title", content.meta.title);
    const ogDescription = upsertMeta("property", "og:description", content.meta.description);
    const ogImage = content.meta.ogImage?.src
      ? upsertMeta("property", "og:image", content.meta.ogImage.src)
      : null;

    return () => {
      if (descriptionMeta.previous) {
        descriptionMeta.el?.setAttribute("content", descriptionMeta.previous);
      } else if (descriptionMeta.created && descriptionMeta.el?.parentNode) {
        descriptionMeta.el.parentNode.removeChild(descriptionMeta.el);
      }

      for (const meta of [ogTitle, ogDescription, ogImage]) {
        if (meta?.created && meta.el?.parentNode) {
          meta.el.parentNode.removeChild(meta.el);
        }
      }
    };
  }, [content.meta.description, content.meta.ogImage?.src, content.meta.title]);

  return (
    <div className={`landing-theme ${styles.page}`} dir="rtl" lang="he">
      <header className={styles.header}>
        <LandingLogo />
      </header>

      <main className={styles.main}>
        <LandingHero data={content.hero} image={content.images.hero} />
        <LandingBenefits data={content.benefits} />
        <LandingSplit
          data={content.splitPrimary}
          image={content.images.splitPrimary}
          sectionVariant="default"
          frameVariant="editorial"
        />
        <LandingProcess data={content.process} />
        <LandingCtaBanner data={content.ctaBanner} />
        <LandingSplit
          data={content.splitSecondary}
          image={content.images.splitSecondary}
          sectionVariant="cream"
          frameVariant="tilted"
        />
        <LandingFaq data={content.faq} />
        <LandingLeadForm data={content.leadForm} formAction={leadFormAction} />
        <LandingFinalCta data={content.finalCta} />
      </main>
    </div>
  );
}

import { useEffect } from "react";
import ProjectsNav from "../../components/projectsNav/ProjectsNav";
import Footer from "../../components/footer/Footer";
import { CONSTS } from "../../consts";
import ServicesHero from "./components/ServicesHero";
import ServicesGrid from "./components/ServicesGrid";
import ProcessSection from "./components/ProcessSection";
import WhyWorkSection from "./components/WhyWorkSection";
import ServicesFaq from "./components/ServicesFaq";
import ServicesFinalCta from "./components/ServicesFinalCta";
import styles from "./ServicesPage.module.scss";

const ServicesPage = () => {
  const { META } = CONSTS.SERVICES_PAGE;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = META.TITLE;

    let metaDescription = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]'
    );
    const created = !metaDescription;
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    const previousContent = metaDescription.getAttribute("content") ?? "";

    metaDescription.setAttribute("content", META.DESCRIPTION);

    const htmlEl = document.documentElement;
    const previousLang = htmlEl.getAttribute("lang");
    htmlEl.setAttribute("lang", "he");

    return () => {
      document.title = previousTitle;
      if (previousContent && metaDescription) {
        metaDescription.setAttribute("content", previousContent);
      } else if (created && metaDescription?.parentNode) {
        metaDescription.parentNode.removeChild(metaDescription);
      }
      if (previousLang !== null) {
        htmlEl.setAttribute("lang", previousLang);
      }
    };
  }, [META.DESCRIPTION, META.TITLE]);

  return (
    <div className={styles.wrapper} dir="rtl" lang="he">
      <ProjectsNav />
      <main className={styles.main}>
        <ServicesHero />
        <ServicesGrid />
        <ProcessSection />
        <WhyWorkSection />
        <ServicesFaq />
        <ServicesFinalCta />
      </main>
      <Footer />
    </div>
  );
};

export default ServicesPage;

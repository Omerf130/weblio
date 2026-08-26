"use client";

import { useEffect, useState } from "react";
import About from "../about/About";
import BackgroundStars from "../background/BackgroundStars";
import Contacts from "../contact/Contacts";
import Footer from "../footer/Footer";
import Hero from "../hero/Hero";
import Loader from "../loader/Loader";
import Metrics from "../metrics/Metrics";
import Nav from "../nav/Nav";
import Projects from "../projects/Projects";
import Services from "../services/Services";
import Testimonials from "../testimonials/Testimonials";
import WhyMe from "../whyMe/WhyMe";
import type { WebsiteLeadFormAction } from "../contact/contact-form-types";
import type { PublicProjectDto } from "../../types/project";
import { useHomePageEffects } from "../../hooks/useHomePageEffects";
import "./HomeShell.scss";
import "../../assets/styles/main.scss";

export default function HomeClient({
  homeProjects,
  leadFormAction,
}: {
  homeProjects?: PublicProjectDto[];
  leadFormAction?: WebsiteLeadFormAction;
}) {
  const [isLoaderDisplay, setIsLoaderDisplay] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoaderDisplay(false);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, []);

  useHomePageEffects(isLoaderDisplay);

  return (
    <div className="app">
      <Nav />
      <BackgroundStars />
      {isLoaderDisplay ? (
        <Loader />
      ) : (
        <>
          <Hero />
          <Metrics />
          <About />
          <Services />
          <WhyMe />
          <Projects projects={homeProjects} />
          <Testimonials />
          <Contacts leadFormAction={leadFormAction} />
          <Footer showQuickLinks />
        </>
      )}
    </div>
  );
}

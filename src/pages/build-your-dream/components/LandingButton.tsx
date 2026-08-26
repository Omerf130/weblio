"use client";



import type { LandingCtaData } from "@/lib/content/build-your-dream/types";

import { useScrollToLeadForm } from "../hooks/useScrollToLeadForm";

import styles from "./LandingButton.module.scss";



type LandingButtonProps = {

  cta: LandingCtaData;

  variant?: "primary" | "secondary" | "ghost" | "onBanner";

  size?: "md" | "lg";

  type?: "button" | "submit";

  disabled?: boolean;

};



export default function LandingButton({

  cta,

  variant = "primary",

  size = "md",

  type = "button",

  disabled = false,

}: LandingButtonProps) {

  const scrollToForm = useScrollToLeadForm();



  const handleClick = () => {

    if (cta.action === "scroll-to-form") {

      scrollToForm();

    }

  };



  return (

    <button
      type={type}
      className={`${styles.button} ${styles[variant]} ${styles[size]}`}
      onClick={cta.action === "scroll-to-form" ? handleClick : undefined}
      disabled={disabled}
      suppressHydrationWarning
    >

      {cta.label}

    </button>

  );

}


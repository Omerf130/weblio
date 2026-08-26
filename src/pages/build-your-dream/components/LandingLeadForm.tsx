"use client";

import { useActionState, useEffect, useState } from "react";
import type { BuildYourDreamLeadForm } from "@/lib/content/build-your-dream/types";
import type { LeadActionState } from "@/lib/leads/action-states";
import Reveal from "@/components/motion/Reveal";
import LandingButton from "./LandingButton";
import LandingSection from "./LandingSection";
import styles from "./LandingLeadForm.module.scss";

export type LandingLeadFormAction = (
  prevState: LeadActionState,
  formData: FormData
) => Promise<LeadActionState>;

type LandingLeadFormProps = {
  data: BuildYourDreamLeadForm;
  formAction: LandingLeadFormAction;
};

const initialState: LeadActionState = {};

type UtmFields = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
};

const EMPTY_UTM: UtmFields = {
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_content: "",
};

export default function LandingLeadForm({ data, formAction }: LandingLeadFormProps) {
  const [state, action, isPending] = useActionState(formAction, initialState);
  const [utm, setUtm] = useState<UtmFields>(EMPTY_UTM);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUtm({
      utm_source: params.get("utm_source") ?? "",
      utm_medium: params.get("utm_medium") ?? "",
      utm_campaign: params.get("utm_campaign") ?? "",
      utm_content: params.get("utm_content") ?? "",
    });
  }, []);

  return (
    <LandingSection id="lead-form" variant="glow" density="loose" ariaLabelledBy="landing-form-title">
      <Reveal className={styles.card}>
        <h2 id="landing-form-title" className={styles.title}>
          {data.title}
        </h2>
        <p className={styles.subtitle}>{data.subtitle}</p>

        <form action={action} className={styles.form} noValidate aria-busy={isPending} suppressHydrationWarning>
          {utm.utm_source ? (
            <input type="hidden" name="utm_source" value={utm.utm_source} />
          ) : null}
          {utm.utm_medium ? (
            <input type="hidden" name="utm_medium" value={utm.utm_medium} />
          ) : null}
          {utm.utm_campaign ? (
            <input type="hidden" name="utm_campaign" value={utm.utm_campaign} />
          ) : null}
          {utm.utm_content ? (
            <input type="hidden" name="utm_content" value={utm.utm_content} />
          ) : null}

          <div className={styles.field}>
            <label htmlFor="lead-form-name">{data.fields.name.label}</label>
            <input
              id="lead-form-name"
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder={data.fields.name.placeholder}
              disabled={isPending}
              suppressHydrationWarning
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="lead-form-phone">{data.fields.phone.label}</label>
            <input
              id="lead-form-phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder={data.fields.phone.placeholder}
              disabled={isPending}
              suppressHydrationWarning
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="lead-form-email">{data.fields.email.label}</label>
            <input
              id="lead-form-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder={data.fields.email.placeholder}
              disabled={isPending}
              suppressHydrationWarning
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="lead-form-message">{data.fields.message.label}</label>
            <textarea
              id="lead-form-message"
              name="message"
              rows={3}
              placeholder={data.fields.message.placeholder}
              disabled={isPending}
              suppressHydrationWarning
            />
          </div>

          {state.error ? (
            <p className={styles.error} role="alert">
              {state.error}
            </p>
          ) : null}

          <LandingButton
            cta={{ label: isPending ? data.submittingLabel : data.submitLabel, action: "submit" }}
            type="submit"
            size="lg"
            disabled={isPending}
          />
        </form>
      </Reveal>
    </LandingSection>
  );
}

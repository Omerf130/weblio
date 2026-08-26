"use client";

import { useActionState } from "react";
import type { BuildYourDreamThankYou } from "@/lib/content/build-your-dream/types";
import type { QualificationActionState } from "@/lib/leads/action-states";
import Reveal from "@/components/motion/Reveal";
import LandingLogo from "./components/LandingLogo";
import QualificationField from "./components/QualificationField";
import styles from "./ThankYouPage.module.scss";
import "./landing-theme.scss";

export type SaveQualificationAction = (
  prevState: QualificationActionState,
  formData: FormData
) => Promise<QualificationActionState>;

type ThankYouPageProps = {
  data: BuildYourDreamThankYou;
  saveAction: SaveQualificationAction;
};

const initialState: QualificationActionState = {};

export default function ThankYouPage({ data, saveAction }: ThankYouPageProps) {
  const [state, formAction, isPending] = useActionState(saveAction, initialState);
  const isCompleted = Boolean(state.success);

  return (
    <div className={`landing-theme ${styles.page}`} dir="rtl" lang="he">
      <header className={styles.header}>
        <LandingLogo />
      </header>

      <main className={styles.main}>
        <Reveal className={styles.card}>
          <p className={styles.step}>{data.stepLabel}</p>

          {isCompleted ? (
            <div role="status">
              <h1 className={styles.title}>{data.completedTitle}</h1>
              <p className={styles.subtitle}>{data.completedText}</p>
            </div>
          ) : (
            <>
              <h1 className={styles.title}>{data.title}</h1>
              <p className={styles.subtitle}>{data.subtitle}</p>

              <section className={styles.nextSteps} aria-labelledby="next-steps-title">
                <h2 id="next-steps-title" className={styles.nextStepsTitle}>
                  {data.nextStepsTitle}
                </h2>
                <ul>
                  {data.nextSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </section>

              <section className={styles.qualification} aria-labelledby="qualification-title">
                <h2 id="qualification-title" className={styles.qualificationTitle}>
                  {data.qualification.title}
                </h2>
                <p className={styles.qualificationSubtitle}>{data.qualification.subtitle}</p>

                <form
                  action={formAction}
                  className={styles.form}
                  noValidate
                  aria-busy={isPending}
                  suppressHydrationWarning
                >
                  {data.qualification.questions.map((question) => (
                    <QualificationField
                      key={question.id}
                      question={question}
                      disabled={isPending}
                    />
                  ))}

                  {state.error ? (
                    <p className={styles.error} role="alert">
                      {state.error}
                    </p>
                  ) : null}

                  <button type="submit" className={styles.submit} disabled={isPending} suppressHydrationWarning>
                    {isPending
                      ? data.qualification.submittingLabel
                      : data.qualification.submitLabel}
                  </button>
                </form>
              </section>
            </>
          )}
        </Reveal>
      </main>
    </div>
  );
}

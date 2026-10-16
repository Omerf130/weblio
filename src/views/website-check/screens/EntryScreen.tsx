"use client";

import { MdChevronLeft, MdDescription, MdGridView, MdPublic, MdTipsAndUpdates, MdVerifiedUser } from "react-icons/md";
import { useState, type FormEvent } from "react";
import type { WebsiteCheckSubmitResult } from "@/lib/website-check/useWebsiteCheckFlow";
import WebsiteCheckEntryVisual from "../components/WebsiteCheckEntryVisual";
import { WEBSITE_CHECK_BENEFITS, WEBSITE_CHECK_COPY } from "../website-check-content";

const BENEFIT_ICONS = {
  "no-commitment": MdVerifiedUser,
  "clear-report": MdDescription,
  recommendations: MdTipsAndUpdates,
  "four-areas": MdGridView,
} as const;

const ENTRY_URL_INPUT_ID = "website-check-entry-url";
const ENTRY_URL_ERROR_ID = "website-check-entry-url-error";

type EntryScreenProps = {
  liveAvailable: boolean;
  configLoaded: boolean;
  onSubmit: (raw: string) => Promise<WebsiteCheckSubmitResult>;
};

export default function EntryScreen({ liveAvailable, configLoaded, onSubmit }: EntryScreenProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const result = await onSubmit(value);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
  };

  return (
    <div className="website-check-entry">
      <div className="website-check-entry__layout">
        <div className="website-check-entry__content">
          <span className="website-check-entry__eyebrow" dir="ltr">
            {WEBSITE_CHECK_COPY.eyebrow}
          </span>

          <h1 className="website-check-entry__headline">{WEBSITE_CHECK_COPY.headline}</h1>

          <p className="website-check-entry__description">{WEBSITE_CHECK_COPY.description}</p>

          <form
            className="website-check-entry__form"
            onSubmit={handleSubmit}
            noValidate
            aria-describedby={error ? ENTRY_URL_ERROR_ID : undefined}
          >
            <label className="website-check-entry__label visually-hidden" htmlFor={ENTRY_URL_INPUT_ID}>
              {WEBSITE_CHECK_COPY.inputLabel}
            </label>

            <div className="website-check-entry__form-composite">
            <div className="website-check-entry__form-row">
              <div className="website-check-entry__field">
                <MdPublic className="website-check-entry__field-icon" aria-hidden />
                <input
                  id={ENTRY_URL_INPUT_ID}
                  name="website-url"
                  type="url"
                  className="website-check-entry__input"
                  placeholder={WEBSITE_CHECK_COPY.inputPlaceholder}
                  dir="ltr"
                  autoComplete="url"
                  inputMode="url"
                  spellCheck={false}
                  value={value}
                  disabled={isSubmitting}
                  suppressHydrationWarning
                  onChange={(event) => {
                    setValue(event.target.value);
                    if (error) setError(null);
                  }}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? ENTRY_URL_ERROR_ID : undefined}
                />
              </div>
              <button
                type="submit"
                className="website-check-entry__submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                suppressHydrationWarning
              >
                {isSubmitting ? "שולחים…" : WEBSITE_CHECK_COPY.submitLabel}
                <MdChevronLeft className="website-check-entry__submit-icon" aria-hidden />
              </button>
            </div>
            </div>

            {error ? (
              <p id={ENTRY_URL_ERROR_ID} className="website-check-entry__error" role="alert">
                {error}
              </p>
            ) : null}
          </form>

          <ul className="website-check-entry__benefits" aria-label="יתרונות הבדיקה">
            {WEBSITE_CHECK_BENEFITS.map((item) => {
              const Icon = BENEFIT_ICONS[item.id];
              return (
                <li key={item.id} className="website-check-entry__benefit">
                  <Icon className="website-check-entry__benefit-icon" aria-hidden />
                  <span>{item.label}</span>
                </li>
              );
            })}
          </ul>

          {configLoaded && !liveAvailable ? (
            <p className="website-check-entry__demo-notice" role="note">
              {WEBSITE_CHECK_COPY.demoNotice}
            </p>
          ) : null}
        </div>

        <WebsiteCheckEntryVisual />
      </div>
    </div>
  );
}

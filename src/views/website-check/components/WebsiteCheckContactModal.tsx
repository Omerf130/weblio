"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { MdClose } from "react-icons/md";

type WebsiteCheckContactModalProps = {
  open: boolean;
  websiteUrl: string;
  analysisRunId: string | null;
  onClose: () => void;
};

type FormState = "idle" | "submitting" | "success" | "error";

export default function WebsiteCheckContactModal({
  open,
  websiteUrl,
  analysisRunId,
  onClose,
}: WebsiteCheckContactModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setName("");
    setPhone("");
    setCompany("");
    setFormState("idle");
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    if (!open) {
      resetForm();
      return undefined;
    }
    const timeout = window.setTimeout(() => nameRef.current?.focus(), 50);
    return () => window.clearTimeout(timeout);
  }, [open, resetForm]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (formState === "submitting" || formState === "success") return;
    if (!analysisRunId) {
      setErrorMessage("לא ניתן לשלוח ללא ניתוח פעיל.");
      setFormState("error");
      return;
    }

    setFormState("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/leads/website-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          analysisRunId,
          websiteUrl,
          company,
        }),
      });

      const payload: { error?: string } = await response.json();
      if (!response.ok) {
        setErrorMessage(payload.error ?? "לא ניתן לשלוח את הפנייה כרגע.");
        setFormState("error");
        return;
      }

      setFormState("success");
    } catch {
      setErrorMessage("שגיאת רשת. נסו שוב.");
      setFormState("error");
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="website-check-modal" role="presentation">
      <button type="button" className="website-check-modal__backdrop" aria-label="סגירה" onClick={onClose} />
      <div
        ref={dialogRef}
        className="website-check-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="website-check-modal__header">
          <h2 id={titleId} className="website-check-modal__title">
            צור קשר לשיפור האתר
          </h2>
          <button type="button" className="website-check-modal__close" onClick={onClose} aria-label="סגור">
            <MdClose aria-hidden />
          </button>
        </header>

        {formState === "success" ? (
          <div className="website-check-modal__success" role="status">
            <p className="website-check-modal__success-title">תודה שהשארת פרטים!</p>
            <p>קיבלתי את הפנייה ואחזור אליך בהקדם.</p>
            <button type="button" className="website-check-modal__submit" onClick={onClose}>
              סגירה
            </button>
          </div>
        ) : (
          <form className="website-check-modal__form" onSubmit={handleSubmit}>
            <div className="website-check-modal__field">
              <label htmlFor="wc-lead-name">שם מלא</label>
              <input
                ref={nameRef}
                id="wc-lead-name"
                name="name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={formState === "submitting"}
              />
            </div>
            <div className="website-check-modal__field">
              <label htmlFor="wc-lead-phone">מספר טלפון</label>
              <input
                id="wc-lead-phone"
                name="phone"
                required
                autoComplete="tel"
                inputMode="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={formState === "submitting"}
              />
            </div>
            <div className="website-check-modal__field">
              <label htmlFor="wc-lead-url">האתר שנבדק</label>
              <input id="wc-lead-url" name="websiteUrl" readOnly dir="ltr" value={websiteUrl} />
            </div>
            <div className="website-check-modal__hp" aria-hidden>
              <label htmlFor="wc-lead-company">Company</label>
              <input
                id="wc-lead-company"
                tabIndex={-1}
                autoComplete="off"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            {errorMessage ? (
              <p className="website-check-modal__error" role="alert">
                {errorMessage}
              </p>
            ) : null}
            <button type="submit" className="website-check-modal__submit" disabled={formState === "submitting"}>
              {formState === "submitting" ? "שולח..." : "שליחה"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

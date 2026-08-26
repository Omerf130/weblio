"use client";

import { useActionState, useEffect, useState } from "react";
import {
  FaBuilding,
  FaCheckCircle,
  FaEnvelope,
  FaPhone,
  FaWhatsapp,
} from "react-icons/fa";
import type { IconType } from "react-icons";
import type { LeadActionState, WebsiteLeadFormAction } from "./contact-form-types";
import "./Contacts.scss";
import Reveal from "../motion/Reveal";
import { CONSTS } from "../../consts";

type ContactsProps = {
  leadFormAction?: WebsiteLeadFormAction;
};

type FormFields = {
  name: string;
  phone: string;
  email: string;
};

type FormErrors = Partial<Record<keyof FormFields, string>>;

type UtmFields = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY_UTM: UtmFields = {
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_content: "",
};

const initialActionState: LeadActionState = {};

const validateField = (field: keyof FormFields, value: string): string => {
  const trimmed = value.trim();

  switch (field) {
    case "name":
      if (!trimmed) return "נא להזין שם";
      return "";
    case "phone": {
      if (!trimmed) return "נא להזין מספר טלפון";
      const digits = trimmed.replace(/\D/g, "");
      if (digits.length < 9) return "מספר טלפון לא תקין";
      if (!/^[\d\s\-+()]+$/.test(trimmed)) return "מספר טלפון לא תקין";
      return "";
    }
    case "email":
      if (!trimmed) return "נא להזין כתובת מייל";
      if (!EMAIL_PATTERN.test(trimmed)) return "כתובת מייל לא תקינה";
      return "";
    default:
      return "";
  }
};

const validateForm = (form: FormFields): FormErrors => {
  const errors: FormErrors = {};
  (Object.keys(form) as (keyof FormFields)[]).forEach((field) => {
    const error = validateField(field, form[field]);
    if (error) errors[field] = error;
  });
  return errors;
};

function readUtmFromUrl(): UtmFields {
  if (typeof window === "undefined") {
    return EMPTY_UTM;
  }

  const params = new URLSearchParams(window.location.search);

  return {
    utm_source: params.get("utm_source") ?? "",
    utm_medium: params.get("utm_medium") ?? "",
    utm_campaign: params.get("utm_campaign") ?? "",
    utm_content: params.get("utm_content") ?? "",
  };
}

async function submitLeadViaFetch(
  _prevState: LeadActionState,
  formData: FormData
): Promise<LeadActionState> {
  try {
    const response = await fetch("/api/leads", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      return { error: "לא ניתן לשלוח את הפנייה כרגע. נסו שוב מאוחר יותר." };
    }

    return { success: true };
  } catch {
    return { error: "לא ניתן לשלוח את הפנייה כרגע. נסו שוב מאוחר יותר." };
  }
}

const Contacts = ({ leadFormAction }: ContactsProps) => {
  const [form, setForm] = useState<FormFields>({
    name: "",
    phone: "",
    email: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [utm, setUtm] = useState<UtmFields>(EMPTY_UTM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchState, setFetchState] = useState<LeadActionState>(initialActionState);
  const [showSuccess, setShowSuccess] = useState(false);

  const action = leadFormAction ?? submitLeadViaFetch;
  const [actionState, formAction, isPending] = useActionState(action, initialActionState);

  const state = leadFormAction ? actionState : fetchState;
  const pending = leadFormAction ? isPending : isSubmitting;

  useEffect(() => {
    setUtm(readUtmFromUrl());
  }, []);

  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      setForm({ name: "", phone: "", email: "" });
      setErrors({});
    }
  }, [state.success]);

  const {
    CONTACT: {
      TITLE,
      SUBTITLE,
      BUSINESS_NAME,
      WHATSAPP_PHONE,
      DISPLAY_PHONE,
      TEL,
      EMAIL,
      WHATSAPP_LABEL,
      FORM_SUBMIT_LABEL,
    },
  } = CONSTS;

  const whatsappHref = `https://wa.me/${WHATSAPP_PHONE}`;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const field = name as keyof FormFields;
    setForm((previous) => ({ ...previous, [field]: value }));
    if (errors[field]) {
      setErrors((previous) => ({
        ...previous,
        [field]: validateField(field, value),
      }));
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const field = name as keyof FormFields;
    setErrors((previous) => ({ ...previous, [field]: validateField(field, value) }));
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      return;
    }

    if (!leadFormAction) {
      void handleClientSubmit(event);
    }
  };

  const handleClientSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);

    try {
      const result = await submitLeadViaFetch(fetchState, formData);
      setFetchState(result);

      if (result.success) {
        setForm({ name: "", phone: "", email: "" });
        setErrors({});
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactItems: {
    id: string;
    label: string;
    value: string;
    icon: IconType;
    href?: string;
    external?: boolean;
  }[] = [
    {
      id: "business",
      label: "שם העסק",
      value: BUSINESS_NAME,
      icon: FaBuilding,
      href: undefined,
    },
    {
      id: "phone",
      label: "טלפון",
      value: DISPLAY_PHONE,
      icon: FaPhone,
      href: `tel:${TEL}`,
    },
    {
      id: "email",
      label: "מייל",
      value: EMAIL,
      icon: FaEnvelope,
      href: `mailto:${EMAIL}`,
    },
    {
      id: "whatsapp",
      label: WHATSAPP_LABEL,
      value: DISPLAY_PHONE,
      icon: FaWhatsapp,
      href: whatsappHref,
      external: true,
    },
  ];

  return (
    <section className="contact" id="contact" dir="rtl">
      <header className="contact__header">
        <Reveal as="h2" className="contact__title">
          {TITLE}
        </Reveal>
        <p className="contact__subtitle">{SUBTITLE}</p>
      </header>

      <div className="contact__panel">
        <div className="contact__grid">
          <div className="contact__details">
            <h3 className="contact__details-title">פרטי התקשרות</h3>
            <ul className="contact__details-list">
              {contactItems.map(({ id, label, value, icon: Icon, href, external }) => (
                <li key={id} className="contact__details-item">
                  <span className="contact__details-icon" aria-hidden>
                    <Icon />
                  </span>
                  <div className="contact__details-body">
                    <span className="contact__details-label">{label}</span>
                    {href ? (
                      <a
                        className="contact__details-link"
                        href={href}
                        {...(external
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {value}
                      </a>
                    ) : (
                      <span className="contact__details-value">{value}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {showSuccess ? (
            <div className="contact__success" role="status">
              <FaCheckCircle className="contact__success-icon" aria-hidden />
              <h3 className="contact__success-title">תודה שהשארת פרטים 🙌</h3>
              <p className="contact__success-text">
                קיבלתי את הפנייה שלך ואחזור אליך בהקדם.
              </p>
              <button
                type="button"
                className="contact__success-link"
                onClick={() => setShowSuccess(false)}
              >
                חזרה לטופס
              </button>
            </div>
          ) : (
            <form
              action={leadFormAction ? formAction : undefined}
              onSubmit={handleFormSubmit}
              className="contact__form"
              noValidate
            >
              <h3 className="contact__form-title">שלחו הודעה</h3>

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

              <div className="contact__field">
                <label htmlFor="contact-name">שם</label>
                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="הכניסו את שמכם"
                  autoComplete="name"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "contact-name-error" : undefined}
                  disabled={pending}
                />
                {errors.name ? (
                  <p id="contact-name-error" className="contact__error" role="alert">
                    {errors.name}
                  </p>
                ) : null}
              </div>

              <div className="contact__field">
                <label htmlFor="contact-phone">מספר טלפון</label>
                <input
                  id="contact-phone"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="05X-XXX-XXXX"
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "contact-phone-error" : undefined}
                  disabled={pending}
                />
                {errors.phone ? (
                  <p id="contact-phone-error" className="contact__error" role="alert">
                    {errors.phone}
                  </p>
                ) : null}
              </div>

              <div className="contact__field">
                <label htmlFor="contact-email">מייל</label>
                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="example@email.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "contact-email-error" : undefined}
                  disabled={pending}
                />
                {errors.email ? (
                  <p id="contact-email-error" className="contact__error" role="alert">
                    {errors.email}
                  </p>
                ) : null}
              </div>

              {state.error ? (
                <p className="contact__error contact__error--form" role="alert">
                  {state.error}
                </p>
              ) : null}

              <button type="submit" className="contact__submit" disabled={pending}>
                {pending ? "שולח..." : FORM_SUBMIT_LABEL}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default Contacts;

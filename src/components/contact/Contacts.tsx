import { useState } from "react";
import {
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaWhatsapp,
} from "react-icons/fa";
import type { IconType } from "react-icons";
import "./Contacts.scss";
import Reveal from "../motion/Reveal";
import { CONSTS } from "../../consts";

type FormFields = {
  name: string;
  phone: string;
  email: string;
};

type FormErrors = Partial<Record<keyof FormFields, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const Contacts = () => {
  const [form, setForm] = useState<FormFields>({
    name: "",
    phone: "",
    email: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as keyof FormFields;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as keyof FormFields;
    setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const message = encodeURIComponent(
      `שם: ${form.name.trim()}\nטלפון: ${form.phone.trim()}\nמייל: ${form.email.trim()}`
    );

    window.location.href = `https://wa.me/${WHATSAPP_PHONE}?text=${message}`;
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

          <form onSubmit={handleSubmit} className="contact__form" noValidate>
            <h3 className="contact__form-title">שלחו הודעה</h3>

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
              />
              {errors.name && (
                <p id="contact-name-error" className="contact__error" role="alert">
                  {errors.name}
                </p>
              )}
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
              />
              {errors.phone && (
                <p id="contact-phone-error" className="contact__error" role="alert">
                  {errors.phone}
                </p>
              )}
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
              />
              {errors.email && (
                <p id="contact-email-error" className="contact__error" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <button type="submit" className="contact__submit">
              {FORM_SUBMIT_LABEL}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contacts;

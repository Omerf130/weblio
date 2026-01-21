import React, { useState } from "react";
import "./Contacts.scss";
import { useInView } from "../../hooks/useInView";
import { CONSTS } from "../../consts";

const Contacts = () => {
  const [form, setForm] = useState({
    name: "",
    message: "",
  });

  const {
    CONTACT: { TITLE },
  } = CONSTS;

  const [ref, isInView] = useInView<HTMLHeadingElement>();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const phoneNumber = "972544993155"; // no "+"
    const message = encodeURIComponent(
      `שם: ${form.name}\nהודעה: ${form.message}`
    );

    // Works on mobile (app) + desktop (web)
    window.location.href = `https://wa.me/${phoneNumber}?text=${message}`;
  };

  return (
    <div className="contact" id="contact">
      <h1 ref={ref} className={isInView ? "slide-top" : ""}>
        {TITLE}
      </h1>
      <p>נשמח לשמוע ממך! מלא את הטופס ונחזור אליך בהקדם</p>

      <form onSubmit={handleSubmit} className="contact-form">
        <label>
          <span>שם מלא</span>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="הכנס את שמך המלא"
            required
          />
        </label>

        <label>
          <span>איך אני יכול לעזור?</span>
          <textarea
            name="message"
            rows={6}
            value={form.message}
            onChange={handleChange}
            placeholder="ספר לי על הפרויקט שלך..."
            required
          />
        </label>

        <button type="submit">שלח הודעה</button>
      </form>
    </div>
  );
};

export default Contacts;

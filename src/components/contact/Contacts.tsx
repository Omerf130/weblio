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

      <form onSubmit={handleSubmit} className="contact-form">
        <label>
          שם מלא
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          איך אני יכול לעזור?
          <textarea
            name="message"
            rows={6}
            value={form.message}
            onChange={handleChange}
            required
          />
        </label>

        <button type="submit">צור קשר</button>
      </form>
    </div>
  );
};

export default Contacts;

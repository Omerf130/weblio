import React, { useState } from "react";
import "./Contacts.scss"
import { useInView } from "../../hooks/useInView";
import { CONSTS } from "../../consts";

const Contacts = () => {
  const [form, setForm] = useState({ name: "", phone: "" });
  const {CONTACT:{TITLE}} = CONSTS;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  
    const name = encodeURIComponent(form.name);
    const phone = encodeURIComponent(form.phone);
    const message = `שם: ${name}%0Aהודעה:: ${phone}`;
  
    const url = `https://web.whatsapp.com/send?phone=972544993155&text=${message}`;
    window.open(url, "_blank");
  };
  const [ref, isInView] = useInView<HTMLDivElement>();

  return (
    <div className="contact" id="contact">
      <h1 className={isInView ? "slide-top" : ""} ref={ref}>{TITLE}</h1>
      <form
        onSubmit={handleSubmit}
       className="contact-form"
      >
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
            name="phone"
           rows={6}
            value={form.phone}
            onChange={handleChange}
            required></textarea>
        </label>
        <button type="submit">צור קשר</button>
      </form>
      {/* <Spline3D /> */}
    </div>
  );
};

export default Contacts;

import { CONSTS } from "../../../consts";
import styles from "./ServicesHero.module.scss";

const whatsappHref = () => {
  const phone = CONSTS.CONTACT.WHATSAPP_PHONE;
  const text = encodeURIComponent(CONSTS.SERVICES_PAGE.HERO.WHATSAPP_PREFILL_MESSAGE);
  return `https://wa.me/${phone}?text=${text}`;
};

const ServicesHero = () => {
  const { HERO } = CONSTS.SERVICES_PAGE;

  return (
    <header className={styles.hero}>
      <span className={styles.glow} aria-hidden />
      <span className={styles.mockup} aria-hidden role="presentation" />
      <div className={styles.inner}>
        <h1 className={styles.h1}>{HERO.TITLE}</h1>
        <p className={styles.lead}>{HERO.SUBTITLE}</p>
        <a
          className={styles.cta}
          href={whatsappHref()}
          target="_blank"
          rel="noopener noreferrer"
        >
          {HERO.CTA_PRIMARY}
        </a>
      </div>
    </header>
  );
};

export default ServicesHero;

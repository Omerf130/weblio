import { Link } from "react-router-dom";
import { CONSTS } from "../../../consts";
import styles from "./ServicesFinalCta.module.scss";

const ServicesFinalCta = () => {
  const { FINAL_CTA } = CONSTS.SERVICES_PAGE;

  return (
    <section className={styles.section} aria-labelledby="services-final-cta">
      <h2 className={styles.h2} id="services-final-cta">
        {FINAL_CTA.TITLE}
      </h2>
      <p className={styles.text}>{FINAL_CTA.TEXT}</p>
      <Link className={styles.link} to="/#contact">
        {FINAL_CTA.BUTTON}
      </Link>
    </section>
  );
};

export default ServicesFinalCta;

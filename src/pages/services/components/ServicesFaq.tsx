import { CONSTS } from "../../../consts";
import styles from "./ServicesFaq.module.scss";

const sectionId = "services-page-faq";

const ServicesFaq = () => {
  const { FAQ, SECTION_TITLES } = CONSTS.SERVICES_PAGE;

  return (
    <section
      className={styles.section}
      aria-labelledby={`${sectionId}-heading`}
    >
      <h2 className={styles.h2} id={`${sectionId}-heading`}>
        {SECTION_TITLES.FAQ}
      </h2>
      <div className={styles.list}>
        {FAQ.map((item) => (
          <details key={item.question} className={styles.details}>
            <summary className={styles.summary}>{item.question}</summary>
            <p className={styles.answer}>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
};

export default ServicesFaq;

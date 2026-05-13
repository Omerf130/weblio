import { CONSTS } from "../../../consts";
import styles from "./WhyWorkSection.module.scss";

const sectionId = "services-page-why";

const WhyWorkSection = () => {
  const { WHY, SECTION_TITLES } = CONSTS.SERVICES_PAGE;

  return (
    <section
      className={styles.section}
      aria-labelledby={`${sectionId}-heading`}
    >
      <h2 className={styles.h2} id={`${sectionId}-heading`}>
        {SECTION_TITLES.WHY}
      </h2>
      <ul className={styles.grid}>
        {WHY.map((item) => (
          <li key={item.title} className={styles.card}>
            <span className={styles.check} aria-hidden>
              ✓
            </span>
            <div>
              <h3 className={styles.title}>{item.title}</h3>
              <p className={styles.description}>{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default WhyWorkSection;

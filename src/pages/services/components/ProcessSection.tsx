import { CONSTS } from "../../../consts";
import styles from "./ProcessSection.module.scss";

const sectionId = "services-page-process";

const ProcessSection = () => {
  const { PROCESS, SECTION_TITLES } = CONSTS.SERVICES_PAGE;

  return (
    <section
      className={styles.section}
      aria-labelledby={`${sectionId}-heading`}
    >
      <h2 className={styles.h2} id={`${sectionId}-heading`}>
        {SECTION_TITLES.PROCESS}
      </h2>
      <ol className={styles.timeline}>
        {PROCESS.map((step, index) => (
          <li key={step.title} className={styles.item}>
            <div className={styles.badge} aria-hidden>
              {index + 1}
            </div>
            <div className={styles.body}>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default ProcessSection;

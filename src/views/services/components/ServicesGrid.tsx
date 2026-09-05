import type { IconType } from "react-icons";
import { FaCode } from "react-icons/fa";
import { BsCartCheckFill, BsCreditCard2Front } from "react-icons/bs";
import { IoIosPhonePortrait } from "react-icons/io";
import { MdRocketLaunch } from "react-icons/md";
import { TbPalette } from "react-icons/tb";
import { CONSTS } from "../../../consts";
import styles from "./ServicesGrid.module.scss";

const ICONS: Record<
  (typeof CONSTS.SERVICES_PAGE.SERVICES)[number]["id"],
  IconType
> = {
  showcase: FaCode,
  landing: MdRocketLaunch,
  ecommerce: BsCartCheckFill,
  uiux: TbPalette,
  digicard: BsCreditCard2Front,
  responsive: IoIosPhonePortrait,
};

const sectionId = "services-page-grid";

const ServicesGrid = () => {
  const { SERVICES, SECTION_TITLES } = CONSTS.SERVICES_PAGE;

  return (
    <section
      className={styles.section}
      id={sectionId}
      aria-labelledby={`${sectionId}-heading`}
    >
      <h2 className={styles.h2} id={`${sectionId}-heading`}>
        {SECTION_TITLES.SERVICES}
      </h2>
      <div className={styles.grid}>
        {SERVICES.map((item) => {
          const Icon = ICONS[item.id];
          return (
            <article key={item.id} className={styles.card}>
              <div className={styles.iconWrap} aria-hidden>
                <Icon size={24} />
              </div>
              <h3 className={styles.title}>{item.title}</h3>
              <p className={styles.description}>{item.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default ServicesGrid;

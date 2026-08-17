import { motion } from "framer-motion";
import { FaCode } from "react-icons/fa";
import { BsCartCheckFill } from "react-icons/bs";
import { MdRocketLaunch } from "react-icons/md";
import type { IconType } from "react-icons";
import { CONSTS } from "../../consts";
import Reveal, { staggerItem, staggerParent } from "../motion/Reveal";
import "./Services.scss";

const ICONS: Record<
  (typeof CONSTS.HOMEPAGE_SERVICES.PREVIEW_ITEMS)[number]["id"],
  IconType
> = {
  showcase: FaCode,
  landing: MdRocketLaunch,
  ecommerce: BsCartCheckFill,
};

const headingId = "home-services-heading";
const subtitleId = "home-services-subtitle";

const Services = () => {
  const { TITLE, SUBTITLE, CTA_VIEW_ALL, PREVIEW_ITEMS } = CONSTS.HOMEPAGE_SERVICES;

  return (
    <section
      className="home-services"
      id="services"
      aria-labelledby={headingId}
      aria-describedby={subtitleId}
      dir="rtl"
    >
      <Reveal as="header" className="home-services__header">
        <h2 className="home-services__title" id={headingId}>
          {TITLE}
        </h2>
        <p id={subtitleId} className="home-services__subtitle">
          {SUBTITLE}
        </p>
      </Reveal>

      <motion.ul
        className="home-services__grid"
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {PREVIEW_ITEMS.map((item) => {
          const Icon = ICONS[item.id];
          return (
            <motion.li
              key={item.id}
              className="home-services__card"
              variants={staggerItem}
            >
              <div className="home-services__icon" aria-hidden>
                <Icon size={22} />
              </div>
              <h3 className="home-services__card-title">{item.title}</h3>
              <p className="home-services__card-line">{item.line}</p>
            </motion.li>
          );
        })}
      </motion.ul>

      <Reveal className="home-services__actions" delay={0.1}>
        <a className="home-services__cta" href="/services">
          {CTA_VIEW_ALL}
        </a>
      </Reveal>
    </section>
  );
};

export default Services;

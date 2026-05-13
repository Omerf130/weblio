import { Link } from "react-router-dom";
import { FaCode } from "react-icons/fa";
import { BsCartCheckFill } from "react-icons/bs";
import { MdRocketLaunch } from "react-icons/md";
import type { IconType } from "react-icons";
import { useInView } from "../../hooks/useInView";
import { CONSTS } from "../../consts";
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
  const [ref, isInView] = useInView<HTMLElement>();
  const { TITLE, SUBTITLE, CTA_VIEW_ALL, PREVIEW_ITEMS } = CONSTS.HOMEPAGE_SERVICES;

  return (
    <section
      className="home-services"
      id="services"
      aria-labelledby={headingId}
      aria-describedby={subtitleId}
      dir="rtl"
    >
      <header className="home-services__header" ref={ref}>
        <h2 className={`home-services__title ${isInView ? "slide-top" : ""}`} id={headingId}>
          {TITLE}
        </h2>
        <p id={subtitleId} className="home-services__subtitle">
          {SUBTITLE}
        </p>
      </header>

      <ul className="home-services__grid">
        {PREVIEW_ITEMS.map((item) => {
          const Icon = ICONS[item.id];
          return (
            <li key={item.id} className="home-services__card">
              <div className="home-services__icon" aria-hidden>
                <Icon size={22} />
              </div>
              <h3 className="home-services__card-title">{item.title}</h3>
              <p className="home-services__card-line">{item.line}</p>
            </li>
          );
        })}
      </ul>

      <div className="home-services__actions">
        <Link className="home-services__cta" to="/services">
          {CTA_VIEW_ALL}
        </Link>
      </div>
    </section>
  );
};

export default Services;

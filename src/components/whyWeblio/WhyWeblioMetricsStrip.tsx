import { motion, type Variants } from "framer-motion";
import { MdFolderOpen, MdPeopleOutline, MdPhoneAndroid } from "react-icons/md";
import { CONSTS } from "../../consts";
import MetricCounter from "../metrics/MetricCounter";
import { staggerItem } from "../motion/Reveal";

const metricsParent: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const METRIC_ICONS = {
  responsive: MdPhoneAndroid,
  projects: MdFolderOpen,
  clients: MdPeopleOutline,
} as const;

const METRIC_ORDER = ["responsive", "projects", "clients"] as const;

export default function WhyWeblioMetricsStrip() {
  const { ITEMS } = CONSTS.METRICS;
  const orderedItems = METRIC_ORDER.map(
    (id) => ITEMS.find((item) => item.id === id)!,
  );

  return (
    <div className="why-weblio__metrics" id="metrics" aria-label="Weblio key metrics">
      <p className="why-weblio__editorial why-weblio__editorial--build why-weblio__editorial--handwritten" aria-hidden>
        <span>Let&apos;s</span>
        <span>Build</span>
        <span>Together</span>
      </p>

      <motion.ul
        className="why-weblio__metrics-list"
        variants={metricsParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        {orderedItems.map((metric, index) => {
          const Icon = METRIC_ICONS[metric.id as keyof typeof METRIC_ICONS];

          return (
            <motion.li
              key={metric.id}
              className="why-weblio__metric"
              variants={staggerItem}
            >
              <div className="why-weblio__metric-value">
                <MetricCounter
                  target={metric.target}
                  suffix={metric.suffix}
                  display={metric.display}
                  valueClassName="why-weblio__metric-value-text"
                  numberClassName="why-weblio__metric-number"
                  suffixClassName="why-weblio__metric-suffix"
                />
              </div>
              <p className="why-weblio__metric-label">
                {Icon ? <Icon className="why-weblio__metric-icon" aria-hidden /> : null}
                {metric.label}
              </p>
              {index < orderedItems.length - 1 ? (
                <span className="why-weblio__metric-divider" aria-hidden />
              ) : null}
            </motion.li>
          );
        })}
      </motion.ul>
    </div>
  );
}

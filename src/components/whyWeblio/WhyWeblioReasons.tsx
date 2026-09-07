import { motion, type Variants } from "framer-motion";
import { MdCode, MdGpsFixed, MdGroups } from "react-icons/md";
import ReasonCard from "./ReasonCard";
import { WHY_WEBLIO_REASONS } from "./whyWeblio-content";

const reasonsParent: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.22,
    },
  },
};

const REASON_ICONS = {
  "01": MdGpsFixed,
  "02": MdCode,
  "03": MdGroups,
} as const;

export default function WhyWeblioReasons() {
  return (
    <motion.ol
      className="why-weblio__reasons"
      variants={reasonsParent}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
    >
      {WHY_WEBLIO_REASONS.map((reason) => {
        const Icon = REASON_ICONS[reason.id as keyof typeof REASON_ICONS];

        return (
          <ReasonCard
            key={reason.id}
            id={reason.id}
            number={reason.number}
            title={reason.title}
            body={reason.body}
            Icon={Icon}
          />
        );
      })}
    </motion.ol>
  );
}

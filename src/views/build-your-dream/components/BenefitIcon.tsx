import {
  FaBolt,
  FaHeart,
  FaRocket,
  FaStar,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";
import type { IconType } from "react-icons";

const ICONS: Record<string, IconType> = {
  sparkles: HiSparkles,
  zap: FaBolt,
  rocket: FaRocket,
  heart: FaHeart,
  star: FaStar,
};

type BenefitIconProps = {
  name: string;
};

export default function BenefitIcon({ name }: BenefitIconProps) {
  const Icon = ICONS[name] ?? FaStar;
  return <Icon aria-hidden />;
}

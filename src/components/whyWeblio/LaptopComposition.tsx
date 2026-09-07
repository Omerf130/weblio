import laptopPhysical from "../../assets/pics/ChatGPT Image Sep 7, 2026, 12_25_14 PM.png";

import { assetSrc } from "../../utils/assetSrc";

import "./WhyWeblio.scss";

type LaptopCompositionProps = {
  className?: string;
};

export default function LaptopComposition({ className }: LaptopCompositionProps) {
  return (
    <div
      className={`laptop-composition laptop-composition--physical${className ? ` ${className}` : ""}`}
    >
      <img
        className="laptop-composition__asset"
        src={assetSrc(laptopPhysical)}
        alt=""
        width={1774}
        height={887}
        decoding="async"
      />
    </div>
  );
}

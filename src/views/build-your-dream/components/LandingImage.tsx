import type { LandingImageData } from "@/lib/content/build-your-dream/types";
import styles from "./LandingImage.module.scss";

type LandingImageProps = {
  image: LandingImageData;
  className?: string;
};

export default function LandingImage({ image, className }: LandingImageProps) {
  return (
    <img
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      loading={image.priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={image.priority ? "high" : "auto"}
      className={`${styles.image} ${className ?? ""}`.trim()}
    />
  );
}

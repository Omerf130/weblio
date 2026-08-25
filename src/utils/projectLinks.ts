import { assetSrc } from "./assetSrc";

export function projectImageSrc(imageUrl: string): string {
  return assetSrc(imageUrl);
}

export function projectHref(projectUrl: string): string {
  return projectUrl;
}

export const PROJECT_LINK_REL = "noopener noreferrer";

export type ProjectImageDto = {
  url: string;
  alt: string;
  storageKey?: string;
};

export type PublicProjectDto = {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  imageUrl: string;
  imageAlt: string;
  projectUrl: string;
  ctaLabel: string;
  technologies: string[];
};

/** Published `/projects` candidates with Admin CMS fields for card assembly. */
export type ProjectsPagePublicProjectDto = PublicProjectDto & {
  isPublished: boolean;
  showOnProjectsPage: boolean;
  featuredOnProjectsPage: boolean;
  projectsPageOrder: number;
  projectsPageFeaturedOrder?: number;
  projectsPageDisplayTitle?: string;
  projectsPageShowFeaturedBadge: boolean;
  projectsPageShowcaseObjectPosition?: string;
  projectsPageShowcase?: ProjectImageDto;
  updatedAt: string;
};

export type AdminProjectDto = {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  homeTitle?: string;
  homeSubtitle?: string;
  imageUrl: string;
  imageAlt: string;
  imageStorageKey?: string;
  projectsPageShowcase?: ProjectImageDto;
  featuredOnProjectsPage: boolean;
  projectsPageFeaturedOrder?: number;
  projectsPageDisplayTitle?: string;
  projectsPageShowFeaturedBadge: boolean;
  projectsPageShowcaseObjectPosition?: string;
  projectUrl: string;
  ctaLabel: string;
  isPublished: boolean;
  showOnHome: boolean;
  showOnProjectsPage: boolean;
  homeOrder: number;
  projectsPageOrder: number;
  technologies: string[];
  updatedAt: string;
  createdAt: string;
};

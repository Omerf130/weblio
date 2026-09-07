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

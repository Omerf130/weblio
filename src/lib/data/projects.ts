import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import {
  HOME_PROJECTS_MAX,
  mapToHomePublicProjectDto,
  mapToPublicProjectDto,
  type HomeProjectSource,
} from "@/lib/projects/rules";
import { Project, type ProjectDocument } from "@/models/Project";
import type {
  AdminProjectDto,
  ProjectsPagePublicProjectDto,
  PublicProjectDto,
} from "@/types/project";

type LeanProject = Omit<ProjectDocument, keyof mongoose.Document> & {
  _id: mongoose.Types.ObjectId;
};

function toAdminProjectDto(project: LeanProject): AdminProjectDto {
  const description = project.description?.trim();
  const showcase = project.projectsPageShowcase;

  return {
    id: project._id.toString(),
    title: project.title,
    subtitle: project.subtitle,
    description: description || undefined,
    homeTitle: project.homeTitle ?? undefined,
    homeSubtitle: project.homeSubtitle ?? undefined,
    imageUrl: project.image?.url ?? "",
    imageAlt: project.image?.alt ?? project.title,
    imageStorageKey: project.image?.storageKey ?? undefined,
    ...(showcase?.url
      ? {
          projectsPageShowcase: {
            url: showcase.url,
            alt: showcase.alt,
            ...(showcase.storageKey ? { storageKey: showcase.storageKey } : {}),
          },
        }
      : {}),
    featuredOnProjectsPage: project.featuredOnProjectsPage ?? false,
    ...(project.projectsPageFeaturedOrder !== undefined &&
    project.projectsPageFeaturedOrder !== null
      ? { projectsPageFeaturedOrder: project.projectsPageFeaturedOrder }
      : {}),
    ...(project.projectsPageDisplayTitle?.trim()
      ? { projectsPageDisplayTitle: project.projectsPageDisplayTitle.trim() }
      : {}),
    projectsPageShowFeaturedBadge: project.projectsPageShowFeaturedBadge ?? false,
    ...(project.projectsPageShowcaseObjectPosition?.trim()
      ? {
          projectsPageShowcaseObjectPosition:
            project.projectsPageShowcaseObjectPosition.trim(),
        }
      : {}),
    projectUrl: project.projectUrl,
    ctaLabel: project.ctaLabel,
    isPublished: project.isPublished,
    showOnHome: project.showOnHome,
    showOnProjectsPage: project.showOnProjectsPage,
    homeOrder: project.homeOrder,
    projectsPageOrder: project.projectsPageOrder,
    technologies: project.technologies ?? [],
    updatedAt: project.updatedAt.toISOString(),
    createdAt: project.createdAt.toISOString(),
  };
}

function toHomeSource(project: LeanProject): HomeProjectSource {
  const description = project.description?.trim();
  return {
    _id: project._id.toString(),
    title: project.title,
    subtitle: project.subtitle,
    description: description || undefined,
    homeTitle: project.homeTitle ?? undefined,
    homeSubtitle: project.homeSubtitle ?? undefined,
    image: {
      url: project.image?.url ?? "",
      alt: project.image?.alt ?? project.title,
    },
    projectUrl: project.projectUrl,
    ctaLabel: project.ctaLabel,
    technologies: project.technologies ?? [],
  };
}

export async function getHomeProjects(): Promise<PublicProjectDto[]> {
  await connectDB();

  const projects = await Project.find({
    isPublished: true,
    showOnHome: true,
    "image.url": { $exists: true, $ne: "" },
  })
    .sort({ homeOrder: 1, updatedAt: 1, _id: 1 })
    .limit(HOME_PROJECTS_MAX)
    .lean<LeanProject[]>();

  return projects.map((project) => mapToHomePublicProjectDto(toHomeSource(project)));
}

function toProjectsPagePublicProjectDto(
  project: LeanProject
): ProjectsPagePublicProjectDto {
  const description = project.description?.trim();
  const showcase = project.projectsPageShowcase;
  const base = mapToPublicProjectDto({
    ...toHomeSource(project),
    title: project.title,
    subtitle: project.subtitle,
  });

  return {
    ...base,
    description: description || undefined,
    isPublished: project.isPublished,
    showOnProjectsPage: project.showOnProjectsPage,
    featuredOnProjectsPage: project.featuredOnProjectsPage ?? false,
    projectsPageOrder: project.projectsPageOrder,
    ...(project.projectsPageFeaturedOrder !== undefined &&
    project.projectsPageFeaturedOrder !== null
      ? { projectsPageFeaturedOrder: project.projectsPageFeaturedOrder }
      : {}),
    ...(project.projectsPageDisplayTitle?.trim()
      ? { projectsPageDisplayTitle: project.projectsPageDisplayTitle.trim() }
      : {}),
    projectsPageShowFeaturedBadge: project.projectsPageShowFeaturedBadge ?? false,
    ...(project.projectsPageShowcaseObjectPosition?.trim()
      ? {
          projectsPageShowcaseObjectPosition:
            project.projectsPageShowcaseObjectPosition.trim(),
        }
      : {}),
    ...(showcase?.url
      ? {
          projectsPageShowcase: {
            url: showcase.url,
            alt: showcase.alt,
            ...(showcase.storageKey ? { storageKey: showcase.storageKey } : {}),
          },
        }
      : {}),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export async function getProjectsPageProjects(): Promise<ProjectsPagePublicProjectDto[]> {
  await connectDB();

  const projects = await Project.find({
    isPublished: true,
    showOnProjectsPage: true,
  })
    .sort({ projectsPageOrder: 1, updatedAt: 1, _id: 1 })
    .lean<LeanProject[]>();

  return projects.map(toProjectsPagePublicProjectDto);
}

export async function getAdminProjects(): Promise<AdminProjectDto[]> {
  await connectDB();

  const projects = await Project.find({})
    .sort({ updatedAt: -1 })
    .lean<LeanProject[]>();

  return projects.map(toAdminProjectDto);
}

export async function getProjectById(id: string): Promise<AdminProjectDto | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  await connectDB();

  const project = await Project.findById(id).lean<LeanProject | null>();
  return project ? toAdminProjectDto(project) : null;
}

export async function countPublishedHomeProjects(excludeId?: string): Promise<number> {
  await connectDB();

  const filter: Record<string, unknown> = {
    isPublished: true,
    showOnHome: true,
  };

  if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
    filter._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
  }

  return Project.countDocuments(filter);
}

import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import {
  HOME_PROJECTS_MAX,
  mapToHomePublicProjectDto,
  mapToPublicProjectDto,
  type HomeProjectSource,
} from "@/lib/projects/rules";
import { Project, type ProjectDocument } from "@/models/Project";
import type { AdminProjectDto, PublicProjectDto } from "@/types/project";

type LeanProject = Omit<ProjectDocument, keyof mongoose.Document> & {
  _id: mongoose.Types.ObjectId;
};

function toAdminProjectDto(project: LeanProject): AdminProjectDto {
  return {
    id: project._id.toString(),
    title: project.title,
    subtitle: project.subtitle,
    homeTitle: project.homeTitle ?? undefined,
    homeSubtitle: project.homeSubtitle ?? undefined,
    imageUrl: project.image.url,
    imageAlt: project.image.alt,
    imageStorageKey: project.image.storageKey ?? undefined,
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
  return {
    _id: project._id.toString(),
    title: project.title,
    subtitle: project.subtitle,
    homeTitle: project.homeTitle ?? undefined,
    homeSubtitle: project.homeSubtitle ?? undefined,
    image: {
      url: project.image.url,
      alt: project.image.alt,
    },
    projectUrl: project.projectUrl,
    ctaLabel: project.ctaLabel,
  };
}

export async function getHomeProjects(): Promise<PublicProjectDto[]> {
  await connectDB();

  const projects = await Project.find({
    isPublished: true,
    showOnHome: true,
  })
    .sort({ homeOrder: 1, updatedAt: 1, _id: 1 })
    .limit(HOME_PROJECTS_MAX)
    .lean<LeanProject[]>();

  return projects.map((project) => mapToHomePublicProjectDto(toHomeSource(project)));
}

export async function getProjectsPageProjects(): Promise<PublicProjectDto[]> {
  await connectDB();

  const projects = await Project.find({
    isPublished: true,
    showOnProjectsPage: true,
  })
    .sort({ projectsPageOrder: 1, updatedAt: 1, _id: 1 })
    .lean<LeanProject[]>();

  return projects.map((project) =>
    mapToPublicProjectDto({
      ...toHomeSource(project),
      title: project.title,
      subtitle: project.subtitle,
    })
  );
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

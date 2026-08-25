"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import mongoose from "mongoose";
import { countPublishedHomeProjects } from "@/lib/data/projects";
import { connectDB } from "@/lib/db/mongoose";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  HOME_MAX_FOUR_ERROR,
  wouldExceedHomeFeaturedLimit,
} from "@/lib/projects/rules";
import {
  projectInputFromFormData,
  safeParseProjectInput,
  validatePublishFields,
} from "@/lib/validations/project";
import { Project } from "@/models/Project";

export type ProjectActionState = {
  error?: string;
};

function revalidateProjectPaths(): void {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/admin/projects");
}

async function validateHomeFeaturedLimit(
  isPublished: boolean,
  showOnHome: boolean,
  excludeId?: string
): Promise<string | null> {
  if (!isPublished || !showOnHome) {
    return null;
  }

  const currentCount = await countPublishedHomeProjects(excludeId);

  if (wouldExceedHomeFeaturedLimit(currentCount, { isPublished, showOnHome })) {
    return HOME_MAX_FOUR_ERROR;
  }

  return null;
}

import type { ProjectInput } from "@/lib/validations/project";

function mapInputToDocument(input: ProjectInput) {
  return {
    title: input.title,
    subtitle: input.subtitle,
    homeTitle: input.homeTitle,
    homeSubtitle: input.homeSubtitle,
    image: {
      url: input.imageUrl,
      alt: input.imageAlt,
    },
    projectUrl: input.projectUrl,
    ctaLabel: input.ctaLabel,
    isPublished: input.isPublished,
    showOnHome: input.showOnHome,
    showOnProjectsPage: input.showOnProjectsPage,
    homeOrder: input.homeOrder,
    projectsPageOrder: input.projectsPageOrder,
    technologies: input.technologies,
  };
}

export async function createProjectAction(
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  await requireAdmin();
  await connectDB();

  const parsed = safeParseProjectInput(projectInputFromFormData(formData));

  if (!parsed.success) {
    return { error: "יש לתקן את השדות המסומנים." };
  }

  const input = parsed.data;

  if (input.isPublished) {
    const publishError = validatePublishFields({
      title: input.title,
      imageUrl: input.imageUrl,
      imageAlt: input.imageAlt,
      projectUrl: input.projectUrl,
    });

    if (publishError) {
      return { error: publishError };
    }
  }

  const homeLimitError = await validateHomeFeaturedLimit(
    input.isPublished,
    input.showOnHome
  );

  if (homeLimitError) {
    return { error: homeLimitError };
  }

  await Project.create(mapInputToDocument(input));

  revalidateProjectPaths();
  redirect("/admin/projects");
}

export async function updateProjectAction(
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  await requireAdmin();
  await connectDB();

  const id = String(formData.get("id") ?? "");

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: "פרויקט לא נמצא." };
  }

  const parsed = safeParseProjectInput(projectInputFromFormData(formData));

  if (!parsed.success) {
    return { error: "יש לתקן את השדות המסומנים." };
  }

  const input = parsed.data;

  if (input.isPublished) {
    const publishError = validatePublishFields({
      title: input.title,
      imageUrl: input.imageUrl,
      imageAlt: input.imageAlt,
      projectUrl: input.projectUrl,
    });

    if (publishError) {
      return { error: publishError };
    }
  }

  const homeLimitError = await validateHomeFeaturedLimit(
    input.isPublished,
    input.showOnHome,
    id
  );

  if (homeLimitError) {
    return { error: homeLimitError };
  }

  const updated = await Project.findByIdAndUpdate(id, mapInputToDocument(input), {
    new: true,
  });

  if (!updated) {
    return { error: "פרויקט לא נמצא." };
  }

  revalidateProjectPaths();
  redirect("/admin/projects");
}

export async function togglePublishProjectAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await connectDB();

  const id = String(formData.get("id") ?? "");
  const nextPublished = formData.get("isPublished") === "true";

  if (!mongoose.Types.ObjectId.isValid(id)) {
    redirect("/admin/projects?error=" + encodeURIComponent("פרויקט לא נמצא."));
  }

  const project = await Project.findById(id);

  if (!project) {
    redirect("/admin/projects?error=" + encodeURIComponent("פרויקט לא נמצא."));
  }

  if (nextPublished) {
    const publishError = validatePublishFields({
      title: project.title,
      imageUrl: project.image.url,
      imageAlt: project.image.alt,
      projectUrl: project.projectUrl,
    });

    if (publishError) {
      redirect("/admin/projects?error=" + encodeURIComponent(publishError));
    }

    const homeLimitError = await validateHomeFeaturedLimit(
      true,
      project.showOnHome,
      id
    );

    if (homeLimitError) {
      redirect("/admin/projects?error=" + encodeURIComponent(homeLimitError));
    }
  }

  project.isPublished = nextPublished;
  await project.save();

  revalidateProjectPaths();
  redirect("/admin/projects");
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await connectDB();

  const id = String(formData.get("id") ?? "");

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return;
  }

  await Project.findByIdAndDelete(id);
  revalidateProjectPaths();
  redirect("/admin/projects");
}

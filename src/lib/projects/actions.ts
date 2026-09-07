"use server";

import { randomUUID } from "node:crypto";
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
import { BlobStorageError } from "@/lib/storage/blob-config";
import {
  deleteProjectImage,
  getImageFileFromFormData,
  isManagedProjectImage,
  type ProjectImageRef,
  uploadProjectImage,
  validateProjectImageFile,
} from "@/lib/storage/project-images";
import type { ProjectFieldsInput } from "@/lib/validations/project";
import {
  projectFieldsFromFormData,
  resolveProjectImageAlt,
  safeParseProjectFields,
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

function mapFieldsToDocument(
  input: ProjectFieldsInput,
  image: ProjectImageRef
) {
  return {
    title: input.title,
    subtitle: input.subtitle,
    description: input.description,
    homeTitle: input.homeTitle,
    homeSubtitle: input.homeSubtitle,
    image: {
      url: image.url,
      alt: resolveProjectImageAlt(input.imageAlt, input.title),
      ...(image.storageKey ? { storageKey: image.storageKey } : {}),
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

function actionErrorFromUnknown(error: unknown): string {
  if (error instanceof BlobStorageError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "שמירת הפרויקט נכשלה. נסו שוב.";
}

export async function createProjectAction(
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  await requireAdmin();
  await connectDB();

  const parsed = safeParseProjectFields(projectFieldsFromFormData(formData));

  if (!parsed.success) {
    return { error: "יש לתקן את השדות המסומנים." };
  }

  const input = parsed.data;
  const imageFile = getImageFileFromFormData(formData);
  const imageValidationError = validateProjectImageFile(imageFile);

  if (imageValidationError) {
    return { error: imageValidationError };
  }

  const homeLimitError = await validateHomeFeaturedLimit(
    input.isPublished,
    input.showOnHome
  );

  if (homeLimitError) {
    return { error: homeLimitError };
  }

  let uploadedImage: ProjectImageRef | null = null;

  try {
    uploadedImage = await uploadProjectImage(imageFile!, randomUUID());

    if (input.isPublished) {
      const publishError = validatePublishFields({
        title: input.title,
        imageUrl: uploadedImage.url,
        projectUrl: input.projectUrl,
      });

      if (publishError) {
        await deleteProjectImage(uploadedImage.storageKey ?? "");
        return { error: publishError };
      }
    }

    await Project.create(mapFieldsToDocument(input, uploadedImage));
  } catch (error) {
    if (uploadedImage?.storageKey) {
      await deleteProjectImage(uploadedImage.storageKey);
    }

    return { error: actionErrorFromUnknown(error) };
  }

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

  const existing = await Project.findById(id);

  if (!existing) {
    return { error: "פרויקט לא נמצא." };
  }

  const parsed = safeParseProjectFields(projectFieldsFromFormData(formData));

  if (!parsed.success) {
    return { error: "יש לתקן את השדות המסומנים." };
  }

  const input = parsed.data;
  const imageFile = getImageFileFromFormData(formData);
  const previousManagedKey = isManagedProjectImage(existing.image.storageKey)
    ? existing.image.storageKey
    : undefined;

  const currentImage: ProjectImageRef = {
    url: existing.image.url,
    storageKey: existing.image.storageKey ?? undefined,
  };

  let uploadedImage: ProjectImageRef | null = null;

  try {
    if (imageFile) {
      const imageValidationError = validateProjectImageFile(imageFile);

      if (imageValidationError) {
        return { error: imageValidationError };
      }

      uploadedImage = await uploadProjectImage(imageFile, id);
    }

    const resolvedImage = uploadedImage ?? currentImage;

    if (input.isPublished) {
      const publishError = validatePublishFields({
        title: input.title,
        imageUrl: resolvedImage.url,
        projectUrl: input.projectUrl,
      });

      if (publishError) {
        if (uploadedImage?.storageKey) {
          await deleteProjectImage(uploadedImage.storageKey);
        }

        return { error: publishError };
      }
    }

    const homeLimitError = await validateHomeFeaturedLimit(
      input.isPublished,
      input.showOnHome,
      id
    );

    if (homeLimitError) {
      if (uploadedImage?.storageKey) {
        await deleteProjectImage(uploadedImage.storageKey);
      }

      return { error: homeLimitError };
    }

    const updated = await Project.findByIdAndUpdate(
      id,
      mapFieldsToDocument(input, resolvedImage),
      { new: true }
    );

    if (!updated) {
      if (uploadedImage?.storageKey) {
        await deleteProjectImage(uploadedImage.storageKey);
      }

      return { error: "פרויקט לא נמצא." };
    }

    if (
      uploadedImage?.storageKey &&
      previousManagedKey &&
      previousManagedKey !== uploadedImage.storageKey
    ) {
      await deleteProjectImage(previousManagedKey);
    }
  } catch (error) {
    if (uploadedImage?.storageKey) {
      await deleteProjectImage(uploadedImage.storageKey);
    }

    return { error: actionErrorFromUnknown(error) };
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

  const project = await Project.findById(id);

  if (!project) {
    return;
  }

  const managedStorageKey = isManagedProjectImage(project.image.storageKey)
    ? project.image.storageKey
    : undefined;

  await Project.findByIdAndDelete(id);

  if (managedStorageKey) {
    await deleteProjectImage(managedStorageKey);
  }

  revalidateProjectPaths();
  redirect("/admin/projects");
}

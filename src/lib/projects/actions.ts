"use server";



import { randomUUID } from "node:crypto";

import { redirect } from "next/navigation";

import { revalidateProjectPaths } from "@/lib/projects/revalidate-paths";

import mongoose from "mongoose";

import { countPublishedHomeProjects } from "@/lib/data/projects";

import { connectDB } from "@/lib/db/mongoose";

import { requireAdmin } from "@/lib/auth/require-admin";

import { mapProjectFieldsToDocument } from "@/lib/projects/project-document-mapper";

import type { ProjectShowcaseImageDocument } from "@/lib/projects/project-document-mapper";

import { validateMainProjectImageRequirement } from "@/lib/projects/project-main-image-policy";
import { getAdminProjectsRedirectPathAfterSave } from "@/lib/projects/project-save-redirect";

import { resolveProjectsPageShowcaseUpdate } from "@/lib/projects/project-showcase-update";

import {

  HOME_MAX_FOUR_ERROR,

  wouldExceedHomeFeaturedLimit,

} from "@/lib/projects/rules";

import { BlobStorageError } from "@/lib/storage/blob-config";

import {

  deleteProjectImage,

  deleteProjectsPageShowcaseImage,

  getImageFileFromFormData,

  getShowcaseImageFileFromFormData,

  isManagedProjectImage,

  isRemoveShowcaseRequested,

  type ProjectImageRef,

  uploadProjectImage,

  uploadProjectsPageShowcaseImage,

  validateProjectImageFile,

} from "@/lib/storage/project-images";

import {

  projectFieldsFromFormData,

  resolveProjectImageAlt,

  safeParseProjectFields,

  validatePublishFields,

} from "@/lib/validations/project";

import { Project } from "@/models/Project";

import type { ProjectActionState } from "@/lib/projects/action-states";



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



function actionErrorFromUnknown(error: unknown): string {

  if (error instanceof BlobStorageError) {

    return error.message;

  }



  if (error instanceof Error && error.message) {

    return error.message;

  }



  return "שמירת הפרויקט נכשלה. נסו שוב.";

}



function existingShowcaseFromProject(project: {

  projectsPageShowcase?: {

    url: string;

    alt: string;

    storageKey?: string | null;

  } | null;

}): ProjectShowcaseImageDocument | null {

  if (!project.projectsPageShowcase?.url) {

    return null;

  }



  return {

    url: project.projectsPageShowcase.url,

    alt: project.projectsPageShowcase.alt,

    ...(project.projectsPageShowcase.storageKey

      ? { storageKey: project.projectsPageShowcase.storageKey }

      : {}),

  };

}



function showcaseAltFromForm(formData: FormData, title: string, fallbackAlt?: string): string {

  const fromForm = String(formData.get("showcaseImageAlt") ?? "").trim();

  if (fromForm) {

    return fromForm;

  }

  if (fallbackAlt?.trim()) {

    return fallbackAlt.trim();

  }

  return resolveProjectImageAlt(undefined, title);

}



function mapperOptionsForShowcase(

  resolution: ReturnType<typeof resolveProjectsPageShowcaseUpdate>,

  preserved?: ProjectShowcaseImageDocument | null

) {

  if (resolution.kind === "apply") {

    return { projectsPageShowcase: resolution.showcase };

  }



  if (preserved) {

    return { projectsPageShowcase: preserved };

  }



  return undefined;

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

  const mainImageError = validateMainProjectImageRequirement({

    showOnHome: input.showOnHome,

    hasNewImageUpload: Boolean(imageFile),

  });

  if (mainImageError) {

    return { error: mainImageError };

  }

  if (imageFile) {

    const imageValidationError = validateProjectImageFile(imageFile);

    if (imageValidationError) {

      return { error: imageValidationError };

    }

  }



  const homeLimitError = await validateHomeFeaturedLimit(

    input.isPublished,

    input.showOnHome

  );



  if (homeLimitError) {

    return { error: homeLimitError };

  }



  const scopeId = randomUUID();

  let uploadedImage: ProjectImageRef | null = null;

  let uploadedShowcase: ProjectImageRef | null = null;



  try {

    if (imageFile) {

      uploadedImage = await uploadProjectImage(imageFile, scopeId);

    }



    const showcaseFile = getShowcaseImageFileFromFormData(formData);

    if (showcaseFile) {

      const showcaseValidationError = validateProjectImageFile(showcaseFile);

      if (showcaseValidationError) {

        if (uploadedImage?.storageKey) {

          await deleteProjectImage(uploadedImage.storageKey);

        }

        return { error: showcaseValidationError };

      }



      uploadedShowcase = await uploadProjectsPageShowcaseImage(showcaseFile, scopeId);

    }



    if (input.isPublished) {

      const publishError = validatePublishFields({

        title: input.title,

        imageUrl: uploadedImage?.url ?? "",

        projectUrl: input.projectUrl,

      });



      if (publishError) {

        if (uploadedImage?.storageKey) {

          await deleteProjectImage(uploadedImage.storageKey);

        }

        if (uploadedShowcase?.storageKey) {

          await deleteProjectsPageShowcaseImage(uploadedShowcase.storageKey);

        }

        return { error: publishError };

      }

      const publishMainImageError = validateMainProjectImageRequirement({

        showOnHome: input.showOnHome,

        imageUrl: uploadedImage?.url,

        hasNewImageUpload: Boolean(uploadedImage),

      });

      if (publishMainImageError) {

        if (uploadedImage?.storageKey) {

          await deleteProjectImage(uploadedImage.storageKey);

        }

        if (uploadedShowcase?.storageKey) {

          await deleteProjectsPageShowcaseImage(uploadedShowcase.storageKey);

        }

        return { error: publishMainImageError };

      }

    }



    const showcaseResolution = resolveProjectsPageShowcaseUpdate({

      existing: null,

      uploaded: uploadedShowcase,

      removeRequested: false,

      showcaseAlt: showcaseAltFromForm(formData, input.title),

    });



    await Project.create(

      mapProjectFieldsToDocument(

        input,

        uploadedImage,

        mapperOptionsForShowcase(showcaseResolution)

      )

    );

  } catch (error) {

    if (uploadedShowcase?.storageKey) {

      await deleteProjectsPageShowcaseImage(uploadedShowcase.storageKey);

    }

    if (uploadedImage?.storageKey) {

      await deleteProjectImage(uploadedImage.storageKey);

    }



    return { error: actionErrorFromUnknown(error) };

  }



  revalidateProjectPaths();

  redirect(await getAdminProjectsRedirectPathAfterSave());

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

  const previousManagedKey = isManagedProjectImage(existing.image?.storageKey)

    ? existing.image?.storageKey

    : undefined;



  const currentImage: ProjectImageRef | null = existing.image?.url?.trim()

    ? {

        url: existing.image.url,

        storageKey: existing.image.storageKey ?? undefined,

      }

    : null;



  let uploadedImage: ProjectImageRef | null = null;

  let uploadedShowcase: ProjectImageRef | null = null;

  const existingShowcase = existingShowcaseFromProject(existing);



  try {

    if (imageFile) {

      const imageValidationError = validateProjectImageFile(imageFile);



      if (imageValidationError) {

        return { error: imageValidationError };

      }



      uploadedImage = await uploadProjectImage(imageFile, id);

    }



    const showcaseFile = getShowcaseImageFileFromFormData(formData);

    if (showcaseFile) {

      const showcaseValidationError = validateProjectImageFile(showcaseFile);

      if (showcaseValidationError) {

        if (uploadedImage?.storageKey) {

          await deleteProjectImage(uploadedImage.storageKey);

        }

        return { error: showcaseValidationError };

      }



      uploadedShowcase = await uploadProjectsPageShowcaseImage(showcaseFile, id);

    }



    const resolvedImage = uploadedImage ?? currentImage;

    const mainImageError = validateMainProjectImageRequirement({

      showOnHome: input.showOnHome,

      imageUrl: resolvedImage?.url,

      hasNewImageUpload: Boolean(uploadedImage),

    });

    if (mainImageError) {

      if (uploadedImage?.storageKey) {

        await deleteProjectImage(uploadedImage.storageKey);

      }

      if (uploadedShowcase?.storageKey) {

        await deleteProjectsPageShowcaseImage(uploadedShowcase.storageKey);

      }

      return { error: mainImageError };

    }



    if (input.isPublished) {

      const publishError = validatePublishFields({

        title: input.title,

        imageUrl: resolvedImage?.url ?? "",

        projectUrl: input.projectUrl,

      });



      if (publishError) {

        if (uploadedImage?.storageKey) {

          await deleteProjectImage(uploadedImage.storageKey);

        }

        if (uploadedShowcase?.storageKey) {

          await deleteProjectsPageShowcaseImage(uploadedShowcase.storageKey);

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

      if (uploadedShowcase?.storageKey) {

        await deleteProjectsPageShowcaseImage(uploadedShowcase.storageKey);

      }



      return { error: homeLimitError };

    }



    const showcaseResolution = resolveProjectsPageShowcaseUpdate({

      existing: existingShowcase,

      uploaded: uploadedShowcase,

      removeRequested: isRemoveShowcaseRequested(formData),

      showcaseAlt: showcaseAltFromForm(formData, input.title, existingShowcase?.alt),

    });



    const updated = await Project.findByIdAndUpdate(

      id,

      mapProjectFieldsToDocument(

        input,

        resolvedImage,

        mapperOptionsForShowcase(showcaseResolution, existingShowcase)

      ),

      { new: true }

    );



    if (!updated) {

      if (uploadedImage?.storageKey) {

        await deleteProjectImage(uploadedImage.storageKey);

      }

      if (uploadedShowcase?.storageKey) {

        await deleteProjectsPageShowcaseImage(uploadedShowcase.storageKey);

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



    if (

      showcaseResolution.kind === "apply" &&

      showcaseResolution.deleteManagedKey

    ) {

      await deleteProjectsPageShowcaseImage(showcaseResolution.deleteManagedKey);

    }

  } catch (error) {

    if (uploadedShowcase?.storageKey) {

      await deleteProjectsPageShowcaseImage(uploadedShowcase.storageKey);

    }

    if (uploadedImage?.storageKey) {

      await deleteProjectImage(uploadedImage.storageKey);

    }



    return { error: actionErrorFromUnknown(error) };

  }



  revalidateProjectPaths();

  redirect(await getAdminProjectsRedirectPathAfterSave());

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

      imageUrl: project.image?.url ?? "",

      projectUrl: project.projectUrl,

    });



    if (publishError) {

      redirect("/admin/projects?error=" + encodeURIComponent(publishError));

    }



    const publishMainImageError = validateMainProjectImageRequirement({

      showOnHome: project.showOnHome,

      imageUrl: project.image?.url,

    });

    if (publishMainImageError) {

      redirect(

        "/admin/projects?error=" + encodeURIComponent(publishMainImageError)

      );

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

  redirect(await getAdminProjectsRedirectPathAfterSave());

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



  const managedStorageKey = isManagedProjectImage(project.image?.storageKey)

    ? project.image?.storageKey

    : undefined;



  const managedShowcaseKey = project.projectsPageShowcase?.storageKey;



  await Project.findByIdAndDelete(id);



  if (managedStorageKey) {

    await deleteProjectImage(managedStorageKey);

  }



  await deleteProjectsPageShowcaseImage(managedShowcaseKey);



  revalidateProjectPaths();

  redirect("/admin/projects");

}



import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import type { WebsiteProjectContentApplyFields } from "@/lib/business/ai-marketing/apply-website-content-validations";
import { revalidateProjectPaths } from "@/lib/projects/revalidate-paths";
import { Project } from "@/models/Project";

export const WEBSITE_CONTENT_FIELD_ALLOWLIST = [
  "title",
  "subtitle",
  "description",
  "homeTitle",
  "homeSubtitle",
  "technologies",
] as const;

export type UpdateProjectWebsiteContentFieldsResult =
  | { ok: true; projectId: string }
  | {
      ok: false;
      reason: "invalid_id" | "not_found" | "validation";
      message: string;
    };

export type ProjectWebsiteContentMongoUpdate = {
  $set: Record<string, string | string[]>;
  $unset?: Record<string, 1>;
};

export function buildWebsiteContentMongoUpdate(
  fields: WebsiteProjectContentApplyFields
): ProjectWebsiteContentMongoUpdate {
  const $set: Record<string, string | string[]> = {
    title: fields.title,
    subtitle: fields.subtitle,
    technologies: fields.technologies,
  };
  const $unset: Record<string, 1> = {};

  if (fields.description === undefined) {
    $unset.description = 1;
  } else {
    $set.description = fields.description;
  }

  if (fields.homeTitle === undefined) {
    $unset.homeTitle = 1;
  } else {
    $set.homeTitle = fields.homeTitle;
  }

  if (fields.homeSubtitle === undefined) {
    $unset.homeSubtitle = 1;
  } else {
    $set.homeSubtitle = fields.homeSubtitle;
  }

  return Object.keys($unset).length > 0 ? { $set, $unset } : { $set };
}

export function assertWebsiteContentUpdateKeysOnly(
  update: ProjectWebsiteContentMongoUpdate
): void {
  const allowed = new Set<string>(WEBSITE_CONTENT_FIELD_ALLOWLIST);

  for (const key of Object.keys(update.$set)) {
    if (!allowed.has(key as (typeof WEBSITE_CONTENT_FIELD_ALLOWLIST)[number])) {
      throw new Error(`Disallowed $set field: ${key}`);
    }
  }

  if (update.$unset) {
    for (const key of Object.keys(update.$unset)) {
      if (!allowed.has(key)) {
        throw new Error(`Disallowed $unset field: ${key}`);
      }
    }
  }
}

export type UpdateProjectWebsiteContentFieldsDeps = {
  connectDB: () => Promise<unknown>;
  projectExists: (id: string) => Promise<boolean>;
  applyUpdate: (
    id: string,
    update: ProjectWebsiteContentMongoUpdate
  ) => Promise<boolean>;
  revalidate: () => void;
};

const defaultDeps: UpdateProjectWebsiteContentFieldsDeps = {
  connectDB,
  projectExists: async (id) => {
    const doc = await Project.findById(id).select("_id").lean();
    return Boolean(doc);
  },
  applyUpdate: async (id, update) => {
    assertWebsiteContentUpdateKeysOnly(update);
    const result = await Project.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      update
    );
    return result.matchedCount === 1 && result.modifiedCount >= 0;
  },
  revalidate: revalidateProjectPaths,
};

export async function updateProjectWebsiteContentFields(
  projectId: string,
  fields: WebsiteProjectContentApplyFields,
  partialDeps?: Partial<UpdateProjectWebsiteContentFieldsDeps>
): Promise<UpdateProjectWebsiteContentFieldsResult> {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return {
      ok: false,
      reason: "invalid_id",
      message: "מזהה פרויקט אינו תקין.",
    };
  }

  const deps = { ...defaultDeps, ...partialDeps };
  await deps.connectDB();

  const exists = await deps.projectExists(projectId);
  if (!exists) {
    return {
      ok: false,
      reason: "not_found",
      message: "פרויקט לא נמצא.",
    };
  }

  const update = buildWebsiteContentMongoUpdate(fields);

  try {
    assertWebsiteContentUpdateKeysOnly(update);
  } catch {
    return {
      ok: false,
      reason: "validation",
      message: "ניתן לעדכן רק שדות תוכן מאושרים.",
    };
  }

  const applied = await deps.applyUpdate(projectId, update);
  if (!applied) {
    return {
      ok: false,
      reason: "not_found",
      message: "פרויקט לא נמצא.",
    };
  }

  deps.revalidate();

  return { ok: true, projectId };
}

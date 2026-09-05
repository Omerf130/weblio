import type { BuildYourDreamContent } from "@/lib/content/build-your-dream/types";
import { STATIC_BUILD_YOUR_DREAM_CONTENT } from "@/lib/content/build-your-dream/static-content";
import {
  getBuildYourDreamLandingDocument,
  upsertBuildYourDreamLanding,
} from "@/lib/data/build-your-dream-landing";
import { connectDB, disconnectDB } from "@/lib/db/mongoose";
import { assertDatabaseNameInUri, getDatabaseEnv } from "@/lib/env";

function mergeGuideCopyWithExisting(
  newCopy: BuildYourDreamContent,
  existing: BuildYourDreamContent
): BuildYourDreamContent {
  return {
    ...newCopy,
    images: existing.images,
    meta: {
      ...newCopy.meta,
      ...(existing.meta.ogImage ? { ogImage: existing.meta.ogImage } : {}),
    },
    thankYou: existing.thankYou,
    leadForm: {
      ...newCopy.leadForm,
      fields: existing.leadForm.fields,
      submittingLabel: existing.leadForm.submittingLabel,
      errorMessage: existing.leadForm.errorMessage,
    },
  };
}

async function migrateLandingGuideCopy(): Promise<void> {
  const env = getDatabaseEnv();
  const databaseName = assertDatabaseNameInUri(env.MONGODB_URI);

  await connectDB();

  const newCopy = structuredClone(STATIC_BUILD_YOUR_DREAM_CONTENT);
  const existing = await getBuildYourDreamLandingDocument();

  if (!existing) {
    const savedAt = await upsertBuildYourDreamLanding(newCopy);
    console.log(
      `Landing guide copy migration complete: created new singleton in "${databaseName}" at ${savedAt.toISOString()}.`
    );
    await disconnectDB();
    process.exit(0);
    return;
  }

  const merged = mergeGuideCopyWithExisting(newCopy, existing);
  const savedAt = await upsertBuildYourDreamLanding(merged);

  console.log(
    `Landing guide copy migration complete: updated existing singleton in "${databaseName}" at ${savedAt.toISOString()}.`
  );
  console.log("Preserved: images, ogImage (if set), thankYou, leadForm fields/submittingLabel/errorMessage.");

  await disconnectDB();
  process.exit(0);
}

migrateLandingGuideCopy().catch(async (error) => {
  console.error(
    `Landing guide copy migration failed: ${error instanceof Error ? error.message : String(error)}`
  );
  await disconnectDB().catch(() => undefined);
  process.exit(1);
});

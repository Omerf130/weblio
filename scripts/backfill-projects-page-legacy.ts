/**
 * One-time migration: legacy /projects fallback → Mongo Projects-page fields.
 *
 * Default: DRY RUN (read + report, zero writes).
 * Apply:   npm run backfill:projects-page -- --apply
 *
 * Optional explicit mongoId overrides can be added in projects-page-backfill-manifest.ts.
 */
import { assertDatabaseNameInUri, getSeedEnv } from "@/lib/env";
import { connectDB, disconnectDB } from "@/lib/db/mongoose";
import {
  applyBackfillPlan,
  buildBackfillPlan,
  formatBackfillPlanReport,
  type BackfillProjectRecord,
  type BackfillUpdateInput,
} from "@/lib/projects/projects-page-backfill";
import { Project } from "@/models/Project";

function parseArgs(argv: string[]): { apply: boolean } {
  let apply = false;

  for (const arg of argv) {
    if (arg === "--apply") {
      apply = true;
    }
  }

  return { apply };
}

function toBackfillRecord(project: {
  _id: { toString(): string };
  title: string;
  projectUrl: string;
  seedKey?: string | null;
  image?: { alt?: string } | null;
  projectsPageShowcase?: BackfillProjectRecord["projectsPageShowcase"];
  projectsPageShowcaseObjectPosition?: string | null;
  projectsPageOrder?: number;
  featuredOnProjectsPage?: boolean;
  projectsPageFeaturedOrder?: number | null;
  projectsPageDisplayTitle?: string | null;
  projectsPageShowFeaturedBadge?: boolean;
}): BackfillProjectRecord {
  return {
    id: project._id.toString(),
    title: project.title,
    projectUrl: project.projectUrl,
    seedKey: project.seedKey,
    imageAlt: project.image?.alt,
    projectsPageShowcase: project.projectsPageShowcase,
    projectsPageShowcaseObjectPosition: project.projectsPageShowcaseObjectPosition,
    projectsPageOrder: project.projectsPageOrder,
    featuredOnProjectsPage: project.featuredOnProjectsPage,
    projectsPageFeaturedOrder: project.projectsPageFeaturedOrder,
    projectsPageDisplayTitle: project.projectsPageDisplayTitle,
    projectsPageShowFeaturedBadge: project.projectsPageShowFeaturedBadge,
  };
}

async function updateProjectRecord(input: BackfillUpdateInput): Promise<void> {
  const { projectId, patch } = input;

  await Project.updateOne(
    { _id: projectId },
    {
      $set: {
        projectsPageShowcase: patch.projectsPageShowcase,
        projectsPageShowcaseObjectPosition: patch.projectsPageShowcaseObjectPosition,
        ...(patch.projectsPageOrder !== undefined
          ? { projectsPageOrder: patch.projectsPageOrder }
          : {}),
        ...(patch.featuredOnProjectsPage !== undefined
          ? { featuredOnProjectsPage: patch.featuredOnProjectsPage }
          : {}),
        ...(patch.projectsPageFeaturedOrder !== undefined
          ? { projectsPageFeaturedOrder: patch.projectsPageFeaturedOrder }
          : {}),
        ...(patch.projectsPageDisplayTitle !== undefined
          ? { projectsPageDisplayTitle: patch.projectsPageDisplayTitle }
          : {}),
        ...(patch.projectsPageShowFeaturedBadge !== undefined
          ? { projectsPageShowFeaturedBadge: patch.projectsPageShowFeaturedBadge }
          : {}),
      },
    }
  );
}

async function main(): Promise<void> {
  const { apply } = parseArgs(process.argv.slice(2));
  const mode = apply ? "apply" : "dry_run";

  if (!apply) {
    console.log("DRY RUN — no Mongo writes will be performed.");
  }

  const env = getSeedEnv();
  assertDatabaseNameInUri(env.MONGODB_URI);

  await connectDB();

  try {
    const documents = await Project.find({}).lean();
    const records = documents.map((doc) =>
      toBackfillRecord(doc as Parameters<typeof toBackfillRecord>[0])
    );

    const plan = buildBackfillPlan(records, mode);
    console.log(formatBackfillPlanReport(plan));

    if (apply) {
      if (plan.status !== "ready") {
        console.error("Apply aborted — plan is not ready.");
        process.exit(1);
      }

      const result = await applyBackfillPlan(plan, {
        updateProject: updateProjectRecord,
      });
      console.log(`Applied updates: ${result.applied}`);
    }

    if (plan.status === "aborted" && apply) {
      process.exit(1);
    }
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  console.error(
    `Projects page backfill failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});

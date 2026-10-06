import {
  getProjectsPageBackfillManifest,
  PROJECTS_PAGE_BACKFILL_TARGET_COUNT,
  type ProjectsPageBackfillGridTarget,
  type ProjectsPageBackfillTarget,
} from "@/lib/projects/projects-page-backfill-manifest";
import {
  BATCH1_SLOTS,
  projectMatchesLegacyGridBatch1Slot,
} from "@/lib/projects/projectsPageGridBatch1";
import { deriveSeedKey } from "@/lib/projects/rules";
import { isManagedProjectsPageShowcase } from "@/lib/storage/project-images";

export type BackfillProjectRecord = {
  id: string;
  title: string;
  projectUrl: string;
  seedKey?: string | null;
  imageAlt?: string;
  projectsPageShowcase?: {
    url?: string;
    alt?: string;
    storageKey?: string | null;
  } | null;
  projectsPageShowcaseObjectPosition?: string | null;
  projectsPageOrder?: number;
  featuredOnProjectsPage?: boolean;
  projectsPageFeaturedOrder?: number | null;
  projectsPageDisplayTitle?: string | null;
  projectsPageShowFeaturedBadge?: boolean;
};

export type BackfillShowcasePatch = {
  url: string;
  alt: string;
};

export type BackfillDesiredPatch = {
  projectsPageShowcase: BackfillShowcasePatch;
  projectsPageShowcaseObjectPosition: string;
  projectsPageOrder?: number;
  featuredOnProjectsPage?: boolean;
  projectsPageFeaturedOrder?: number;
  projectsPageDisplayTitle?: string;
  projectsPageShowFeaturedBadge?: boolean;
};

export type BackfillRowStatus =
  | "unchanged"
  | "will_update"
  | "conflict"
  | "missing"
  | "ambiguous";

export type BackfillPlanRow = {
  target: ProjectsPageBackfillTarget;
  status: BackfillRowStatus;
  matchedProjectIds: string[];
  matchedTitle?: string;
  matchedSeedKey?: string;
  current?: Partial<BackfillDesiredPatch & { showcaseStorageKey?: string | null }>;
  proposed?: BackfillDesiredPatch;
  message?: string;
};

export type BackfillPlan = {
  mode: "dry_run" | "apply";
  status: "ready" | "aborted";
  abortReason?: string;
  rows: BackfillPlanRow[];
  updateCount: number;
  unchangedCount: number;
};

function projectIdentitySeedKey(project: BackfillProjectRecord): string | null {
  const stored = project.seedKey?.trim();
  if (stored) {
    return stored;
  }

  try {
    return deriveSeedKey(project.projectUrl);
  } catch {
    return null;
  }
}

function toPublicProjectShape(project: BackfillProjectRecord) {
  return {
    id: project.id,
    title: project.title,
    subtitle: "",
    projectUrl: project.projectUrl,
    imageUrl: "",
    imageAlt: project.imageAlt ?? project.title,
    ctaLabel: "Take me",
    technologies: [] as string[],
  };
}

function matchesFeaturedTarget(
  project: BackfillProjectRecord,
  target: ProjectsPageBackfillTarget
): boolean {
  if (target.kind !== "featured") {
    return false;
  }

  if (target.mongoId && project.id === target.mongoId) {
    return true;
  }

  const identity = projectIdentitySeedKey(project);
  if (!identity) {
    return false;
  }

  return (target.canonicalSeedKeys as readonly string[]).includes(identity);
}

function matchesGridTarget(
  project: BackfillProjectRecord,
  target: ProjectsPageBackfillGridTarget
): boolean {
  if (target.mongoId && project.id === target.mongoId) {
    return true;
  }

  const slot = BATCH1_SLOTS.find((entry) => entry.id === target.slotId);
  if (!slot) {
    return false;
  }

  return projectMatchesLegacyGridBatch1Slot(toPublicProjectShape(project), slot);
}

function matchesTarget(
  project: BackfillProjectRecord,
  target: ProjectsPageBackfillTarget
): boolean {
  if (target.kind === "featured") {
    return matchesFeaturedTarget(project, target);
  }

  return matchesGridTarget(project, target);
}

export function resolveBackfillMatches(
  projects: BackfillProjectRecord[],
  manifest: ProjectsPageBackfillTarget[] = getProjectsPageBackfillManifest()
): BackfillPlanRow[] {
  return manifest.map((target) => {
    const matches = projects.filter((project) => matchesTarget(project, target));

    if (matches.length === 0) {
      return {
        target,
        status: "missing" as const,
        matchedProjectIds: [],
        message: "No Mongo project matched this legacy slot.",
      };
    }

    if (matches.length > 1) {
      return {
        target,
        status: "ambiguous" as const,
        matchedProjectIds: matches.map((project) => project.id),
        message: `Multiple projects matched (${matches.length}).`,
      };
    }

    const match = matches[0]!;
    return {
      target,
      status: "will_update",
      matchedProjectIds: [match.id],
      matchedTitle: match.title,
      matchedSeedKey: projectIdentitySeedKey(match) ?? undefined,
    };
  });
}

function showcaseAltForProject(
  project: BackfillProjectRecord,
  target: ProjectsPageBackfillTarget
): string {
  if (target.kind === "featured") {
    return target.showcaseAlt;
  }

  return project.imageAlt?.trim() || project.title.trim();
}

export function buildDesiredPatch(
  project: BackfillProjectRecord,
  target: ProjectsPageBackfillTarget
): BackfillDesiredPatch {
  const base: BackfillDesiredPatch = {
    projectsPageShowcase: {
      url: target.showcaseUrl,
      alt: showcaseAltForProject(project, target),
    },
    projectsPageShowcaseObjectPosition: target.objectPosition,
  };

  if (target.kind === "grid") {
    return {
      ...base,
      projectsPageOrder: target.projectsPageOrder,
    };
  }

  return {
    ...base,
    featuredOnProjectsPage: target.featuredOnProjectsPage,
    projectsPageFeaturedOrder: target.projectsPageFeaturedOrder,
    projectsPageDisplayTitle: target.projectsPageDisplayTitle,
    projectsPageShowFeaturedBadge: target.projectsPageShowFeaturedBadge,
  };
}

function normalizeOptionalString(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function patchesEqual(a: BackfillDesiredPatch, b: BackfillDesiredPatch): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Only actual persisted Mongo fields — never proposed fallbacks. */
function buildPersistedComparablePatch(
  project: BackfillProjectRecord,
  target: ProjectsPageBackfillTarget
): BackfillDesiredPatch | undefined {
  const existingUrl = project.projectsPageShowcase?.url?.trim();
  if (!existingUrl) {
    return undefined;
  }

  const objectPosition = normalizeOptionalString(project.projectsPageShowcaseObjectPosition);
  if (!objectPosition) {
    return undefined;
  }

  const base: BackfillDesiredPatch = {
    projectsPageShowcase: {
      url: existingUrl,
      alt: project.projectsPageShowcase?.alt?.trim() || showcaseAltForProject(project, target),
    },
    projectsPageShowcaseObjectPosition: objectPosition,
  };

  if (target.kind === "grid") {
    if (project.projectsPageOrder == null) {
      return undefined;
    }

    return {
      ...base,
      projectsPageOrder: project.projectsPageOrder,
    };
  }

  if (project.featuredOnProjectsPage !== target.featuredOnProjectsPage) {
    return undefined;
  }

  if (project.projectsPageFeaturedOrder !== target.projectsPageFeaturedOrder) {
    return undefined;
  }

  const displayTitle = normalizeOptionalString(project.projectsPageDisplayTitle);
  if (displayTitle === undefined) {
    return undefined;
  }

  if (project.projectsPageShowFeaturedBadge === undefined) {
    return undefined;
  }

  return {
    ...base,
    featuredOnProjectsPage: project.featuredOnProjectsPage,
    projectsPageFeaturedOrder: project.projectsPageFeaturedOrder,
    projectsPageDisplayTitle: displayTitle,
    projectsPageShowFeaturedBadge: project.projectsPageShowFeaturedBadge,
  };
}

export function evaluateBackfillRow(
  project: BackfillProjectRecord,
  target: ProjectsPageBackfillTarget
): BackfillPlanRow {
  const proposed = buildDesiredPatch(project, target);
  const existingUrl = project.projectsPageShowcase?.url?.trim();
  const existingStorageKey = project.projectsPageShowcase?.storageKey;

  const current: BackfillPlanRow["current"] = {
    projectsPageShowcase: existingUrl
      ? {
          url: existingUrl,
          alt: project.projectsPageShowcase?.alt?.trim() ?? "",
        }
      : undefined,
    showcaseStorageKey: existingStorageKey ?? null,
    projectsPageShowcaseObjectPosition: normalizeOptionalString(
      project.projectsPageShowcaseObjectPosition
    ),
    projectsPageOrder: project.projectsPageOrder,
    featuredOnProjectsPage: project.featuredOnProjectsPage,
    projectsPageFeaturedOrder: project.projectsPageFeaturedOrder ?? undefined,
    projectsPageDisplayTitle: normalizeOptionalString(project.projectsPageDisplayTitle),
    projectsPageShowFeaturedBadge: project.projectsPageShowFeaturedBadge,
  };

  if (existingUrl) {
    if (isManagedProjectsPageShowcase(existingStorageKey)) {
      return {
        target,
        status: "conflict",
        matchedProjectIds: [project.id],
        matchedTitle: project.title,
        matchedSeedKey: projectIdentitySeedKey(project) ?? undefined,
        current,
        proposed,
        message: "Existing managed Blob showcase must not be overwritten.",
      };
    }

    if (existingUrl !== target.showcaseUrl) {
      return {
        target,
        status: "conflict",
        matchedProjectIds: [project.id],
        matchedTitle: project.title,
        matchedSeedKey: projectIdentitySeedKey(project) ?? undefined,
        current,
        proposed,
        message: "Existing showcase URL differs from legacy static target.",
      };
    }
  }

  const persistedComparable = buildPersistedComparablePatch(project, target);

  if (persistedComparable && patchesEqual(persistedComparable, proposed)) {
    return {
      target,
      status: "unchanged",
      matchedProjectIds: [project.id],
      matchedTitle: project.title,
      matchedSeedKey: projectIdentitySeedKey(project) ?? undefined,
      current,
      proposed,
    };
  }

  return {
    target,
    status: "will_update",
    matchedProjectIds: [project.id],
    matchedTitle: project.title,
    matchedSeedKey: projectIdentitySeedKey(project) ?? undefined,
    current,
    proposed,
  };
}

export function buildBackfillPlan(
  projects: BackfillProjectRecord[],
  mode: "dry_run" | "apply"
): BackfillPlan {
  const matchRows = resolveBackfillMatches(projects);
  const rows: BackfillPlanRow[] = [];

  for (const matchRow of matchRows) {
    if (matchRow.status === "missing" || matchRow.status === "ambiguous") {
      rows.push(matchRow);
      continue;
    }

    const projectId = matchRow.matchedProjectIds[0]!;
    const project = projects.find((entry) => entry.id === projectId);
    if (!project) {
      rows.push({
        ...matchRow,
        status: "missing",
        message: "Matched project id not found in input set.",
      });
      continue;
    }

    rows.push(evaluateBackfillRow(project, matchRow.target));
  }

  const hasBlocking = rows.some(
    (row) =>
      row.status === "missing" ||
      row.status === "ambiguous" ||
      row.status === "conflict"
  );

  const updateCount = rows.filter((row) => row.status === "will_update").length;
  const unchangedCount = rows.filter((row) => row.status === "unchanged").length;

  return {
    mode,
    status: hasBlocking ? "aborted" : "ready",
    abortReason: hasBlocking
      ? "One or more targets are missing, ambiguous, or in conflict."
      : undefined,
    rows,
    updateCount,
    unchangedCount,
  };
}

export type BackfillUpdateInput = {
  projectId: string;
  patch: BackfillDesiredPatch;
};

export function backfillUpdatesFromPlan(plan: BackfillPlan): BackfillUpdateInput[] {
  if (plan.status !== "ready") {
    return [];
  }

  return plan.rows
    .filter((row) => row.status === "will_update" && row.proposed)
    .map((row) => ({
      projectId: row.matchedProjectIds[0]!,
      patch: row.proposed!,
    }));
}

export type ApplyBackfillDeps = {
  updateProject: (input: BackfillUpdateInput) => Promise<void>;
};

export type ApplyBackfillResult = {
  applied: number;
  skipped: number;
};

export async function applyBackfillPlan(
  plan: BackfillPlan,
  deps: ApplyBackfillDeps
): Promise<ApplyBackfillResult> {
  if (plan.mode !== "apply") {
    return { applied: 0, skipped: backfillUpdatesFromPlan(plan).length };
  }

  if (plan.status !== "ready") {
    return { applied: 0, skipped: backfillUpdatesFromPlan(plan).length };
  }

  const updates = backfillUpdatesFromPlan(plan);
  for (const update of updates) {
    await deps.updateProject(update);
  }

  return { applied: updates.length, skipped: plan.unchangedCount };
}

export function formatBackfillPlanReport(plan: BackfillPlan): string {
  const lines: string[] = [
    `Mode: ${plan.mode}`,
    `Status: ${plan.status}`,
    `Targets: ${PROJECTS_PAGE_BACKFILL_TARGET_COUNT}`,
    `Will update: ${plan.updateCount}`,
    `Unchanged: ${plan.unchangedCount}`,
  ];

  if (plan.abortReason) {
    lines.push(`Abort reason: ${plan.abortReason}`);
  }

  lines.push("");
  lines.push("Rows:");

  for (const row of plan.rows) {
    const targetLabel =
      row.target.kind === "featured"
        ? `featured:${row.target.slot}`
        : `grid:${row.target.slotId}`;
    lines.push(`- [${row.status}] ${targetLabel}`);
    if (row.matchedProjectIds.length > 0) {
      lines.push(`  id: ${row.matchedProjectIds.join(", ")}`);
    }
    if (row.matchedTitle) {
      lines.push(`  title: ${row.matchedTitle}`);
    }
    if (row.matchedSeedKey) {
      lines.push(`  seedKey: ${row.matchedSeedKey}`);
    }
    if (row.message) {
      lines.push(`  note: ${row.message}`);
    }
    if (row.current) {
      lines.push(`  current: ${JSON.stringify(row.current)}`);
    }
    if (row.proposed) {
      lines.push(`  proposed: ${JSON.stringify(row.proposed)}`);
    }
  }

  return lines.join("\n");
}

import type { ProjectsPageLegacyFeaturedSlot } from "@/lib/projects/projects-page-legacy-showcase";
import {
  BATCH1_SLOTS,
  type ProjectsPageGridBatch1SlotId,
} from "@/lib/projects/projectsPageGridBatch1";

/** Migration-only static paths (also referenced from Mongo after backfill). */
export const PROJECTS_PAGE_MIGRATION_FEATURED_EVOIR_IMAGE = "/pics/evoir-projects.png";
export const PROJECTS_PAGE_MIGRATION_FEATURED_LACE_IMAGE = "/pics/lace-projects.png";
export const PROJECTS_PAGE_MIGRATION_FEATURED_EVOIR_DISPLAY_TITLE = "ÉVOIR";
export const PROJECTS_PAGE_MIGRATION_FEATURED_LACE_DISPLAY_TITLE = "Lace Models";

export const PROJECTS_PAGE_BACKFILL_FEATURED_EVOIR_ALT =
  "תצוגת אתר ÉVOIR: מחשב נייד וטלפון על רקע בושם ופרחים";

export const PROJECTS_PAGE_BACKFILL_FEATURED_LACE_ALT =
  "תצוגת אתר Lace Models: מחשב נייד וטלפון בסגנון אופנה עריכתי";

export const PROJECTS_PAGE_BACKFILL_EVOIR_CANONICAL_SEED_KEYS = [
  "jozeflaperfume.co.il",
] as const;

export const PROJECTS_PAGE_BACKFILL_LACE_CANONICAL_SEED_KEYS = ["lacemodel.com"] as const;

export type ProjectsPageBackfillFeaturedTarget = {
  kind: "featured";
  slot: ProjectsPageLegacyFeaturedSlot;
  label: string;
  canonicalSeedKeys: readonly string[];
  mongoId?: string;
  showcaseUrl: string;
  showcaseAlt: string;
  objectPosition: string;
  featuredOnProjectsPage: true;
  projectsPageFeaturedOrder: number;
  projectsPageDisplayTitle: string;
  projectsPageShowFeaturedBadge: boolean;
};

export type ProjectsPageBackfillGridTarget = {
  kind: "grid";
  slotId: ProjectsPageGridBatch1SlotId;
  label: string;
  projectsPageOrder: number;
  mongoId?: string;
  showcaseUrl: string;
  objectPosition: string;
};

export type ProjectsPageBackfillTarget =
  | ProjectsPageBackfillFeaturedTarget
  | ProjectsPageBackfillGridTarget;

const FEATURED_TARGETS: ProjectsPageBackfillFeaturedTarget[] = [
  {
    kind: "featured",
    slot: "evoir",
    label: "ÉVOIR",
    canonicalSeedKeys: PROJECTS_PAGE_BACKFILL_EVOIR_CANONICAL_SEED_KEYS,
    showcaseUrl: PROJECTS_PAGE_MIGRATION_FEATURED_EVOIR_IMAGE,
    showcaseAlt: PROJECTS_PAGE_BACKFILL_FEATURED_EVOIR_ALT,
    objectPosition: "28% 50%",
    featuredOnProjectsPage: true,
    projectsPageFeaturedOrder: 1,
    projectsPageDisplayTitle: PROJECTS_PAGE_MIGRATION_FEATURED_EVOIR_DISPLAY_TITLE,
    projectsPageShowFeaturedBadge: true,
  },
  {
    kind: "featured",
    slot: "lace",
    label: "Lace Models",
    canonicalSeedKeys: PROJECTS_PAGE_BACKFILL_LACE_CANONICAL_SEED_KEYS,
    showcaseUrl: PROJECTS_PAGE_MIGRATION_FEATURED_LACE_IMAGE,
    showcaseAlt: PROJECTS_PAGE_BACKFILL_FEATURED_LACE_ALT,
    objectPosition: "38% 52%",
    featuredOnProjectsPage: true,
    projectsPageFeaturedOrder: 2,
    projectsPageDisplayTitle: PROJECTS_PAGE_MIGRATION_FEATURED_LACE_DISPLAY_TITLE,
    projectsPageShowFeaturedBadge: false,
  },
];

/** Public grid order for legacy migration targets (Tabi = 1 is Admin-managed, not in manifest). */
export const PROJECTS_PAGE_BACKFILL_GRID_ORDER_BY_SLOT: Record<
  ProjectsPageGridBatch1SlotId,
  number
> = {
  "eden-shemesh": 2,
  mavrik100: 3,
  ashkenazi: 4,
  noah: 5,
  ganmetukim: 6,
  ogen: 7,
  shiputi: 8,
  zouko: 9,
};

function gridTargetsFromBatch1(): ProjectsPageBackfillGridTarget[] {
  return BATCH1_SLOTS.map((slot) => ({
    kind: "grid" as const,
    slotId: slot.id,
    label: slot.id,
    projectsPageOrder: PROJECTS_PAGE_BACKFILL_GRID_ORDER_BY_SLOT[slot.id],
    showcaseUrl: slot.showcaseImageSrc,
    objectPosition: slot.objectPosition,
  }));
}

/** Fixed list of 10 legacy-visible projects (2 Featured + 8 grid). Tabi is intentionally excluded. */
export function getProjectsPageBackfillManifest(): ProjectsPageBackfillTarget[] {
  return [...FEATURED_TARGETS, ...gridTargetsFromBatch1()];
}

export const PROJECTS_PAGE_BACKFILL_TARGET_COUNT = 10;

import {
  PROJECTS_PAGE_FEATURED_EVOIR_DISPLAY_TITLE,
  PROJECTS_PAGE_FEATURED_EVOIR_IMAGE,
  PROJECTS_PAGE_FEATURED_LACE_DISPLAY_TITLE,
  PROJECTS_PAGE_FEATURED_LACE_IMAGE,
  type ProjectsPageFeaturedSlot,
} from "@/lib/projects/projectsPageFeatured";
import {
  BATCH1_SLOTS,
  type ProjectsPageGridBatch1SlotId,
} from "@/lib/projects/projectsPageGridBatch1";

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
  slot: ProjectsPageFeaturedSlot;
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
    showcaseUrl: PROJECTS_PAGE_FEATURED_EVOIR_IMAGE,
    showcaseAlt: PROJECTS_PAGE_BACKFILL_FEATURED_EVOIR_ALT,
    objectPosition: "28% 50%",
    featuredOnProjectsPage: true,
    projectsPageFeaturedOrder: 1,
    projectsPageDisplayTitle: PROJECTS_PAGE_FEATURED_EVOIR_DISPLAY_TITLE,
    projectsPageShowFeaturedBadge: true,
  },
  {
    kind: "featured",
    slot: "lace",
    label: "Lace Models",
    canonicalSeedKeys: PROJECTS_PAGE_BACKFILL_LACE_CANONICAL_SEED_KEYS,
    showcaseUrl: PROJECTS_PAGE_FEATURED_LACE_IMAGE,
    showcaseAlt: PROJECTS_PAGE_BACKFILL_FEATURED_LACE_ALT,
    objectPosition: "38% 52%",
    featuredOnProjectsPage: true,
    projectsPageFeaturedOrder: 2,
    projectsPageDisplayTitle: PROJECTS_PAGE_FEATURED_LACE_DISPLAY_TITLE,
    projectsPageShowFeaturedBadge: false,
  },
];

function gridTargetsFromBatch1(): ProjectsPageBackfillGridTarget[] {
  return BATCH1_SLOTS.map((slot, index) => ({
    kind: "grid" as const,
    slotId: slot.id,
    label: slot.id,
    projectsPageOrder: index + 1,
    showcaseUrl: slot.showcaseImageSrc,
    objectPosition: slot.objectPosition,
  }));
}

/** Fixed list of 10 legacy-visible projects (2 Featured + 8 grid). Tabi is intentionally excluded. */
export function getProjectsPageBackfillManifest(): ProjectsPageBackfillTarget[] {
  return [...FEATURED_TARGETS, ...gridTargetsFromBatch1()];
}

export const PROJECTS_PAGE_BACKFILL_TARGET_COUNT = 10;

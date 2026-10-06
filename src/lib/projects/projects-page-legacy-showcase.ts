/**
 * Migration-only legacy showcase resolution (batch-1 + Featured identity).
 * Not used by public `/projects` runtime after Checkpoint 4B.
 */
import {
  BATCH1_SLOTS,
  type Batch1SlotConfig,
  projectMatchesLegacyGridBatch1Slot,
} from "@/lib/projects/projectsPageGridBatch1";
import { deriveSeedKey } from "@/lib/projects/rules";
import type { PublicProjectDto } from "@/types/project";

export type ProjectsPageLegacyFeaturedSlot = "evoir" | "lace";

const EVOIR_SEED_KEYS = new Set(["jozeflaperfume.co.il"]);
const LACE_SEED_KEYS = new Set(["lacemodel.com"]);

function normalizeTitle(value: string): string {
  return value.trim().toLowerCase();
}

export function isLegacyEvoirProject(project: PublicProjectDto): boolean {
  try {
    if (EVOIR_SEED_KEYS.has(deriveSeedKey(project.projectUrl))) {
      return true;
    }
  } catch {
    // invalid URL — fall through to title heuristics
  }

  const title = normalizeTitle(project.title);
  return (
    title.includes("jozer") ||
    title.includes("jozef") ||
    title.includes("perfume") ||
    title.includes("évoir") ||
    title.includes("evoir")
  );
}

export function isLegacyLaceProject(project: PublicProjectDto): boolean {
  try {
    if (LACE_SEED_KEYS.has(deriveSeedKey(project.projectUrl))) {
      return true;
    }
  } catch {
    // invalid URL — fall through to title heuristics
  }

  const title = normalizeTitle(project.title);
  return title === "lace" || title.startsWith("lace ");
}

export function findLegacyGridSlotForProject(
  project: PublicProjectDto
): Batch1SlotConfig | undefined {
  return BATCH1_SLOTS.find((slot) => projectMatchesLegacyGridBatch1Slot(project, slot));
}

export function findLegacyFeaturedSlotForProject(
  project: PublicProjectDto
): ProjectsPageLegacyFeaturedSlot | undefined {
  if (isLegacyEvoirProject(project)) {
    return "evoir";
  }
  if (isLegacyLaceProject(project)) {
    return "lace";
  }
  return undefined;
}

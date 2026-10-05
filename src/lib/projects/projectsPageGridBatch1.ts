import { deriveSeedKey } from "@/lib/projects/rules";
import {
  PROJECTS_PAGE_FEATURED_CTA_LABEL,
  compactFeaturedDescription,
  featuredTagsForProject,
} from "@/lib/projects/projectsPageFeatured";
import type { PublicProjectDto } from "@/types/project";

export const PROJECTS_PAGE_GRID_BATCH1_MAX_DESCRIPTION_CHARS = 140;

export type ProjectsPageGridBatch1SlotId =
  | "zouko"
  | "eden-shemesh"
  | "mavrik100"
  | "ashkenazi"
  | "noah"
  | "ganmetukim"
  | "ogen"
  | "shiputi";

type Batch1SlotConfig = {
  id: ProjectsPageGridBatch1SlotId;
  showcaseImageSrc: string;
  seedKeys: string[];
  matchProject?: (project: PublicProjectDto) => boolean;
  objectPosition: string;
};

const BATCH1_SLOTS: Batch1SlotConfig[] = [
  {
    id: "zouko",
    showcaseImageSrc: "/pics/project-pics/zuoko.png",
    seedKeys: ["zoukoisrael.com"],
    objectPosition: "32% 50%",
  },
  {
    id: "eden-shemesh",
    showcaseImageSrc: "/pics/project-pics/eden-shemesh.png",
    seedKeys: ["www.eden-shemesh.co.il", "eden-shemesh.co.il"],
    objectPosition: "34% 50%",
  },
  {
    id: "mavrik100",
    showcaseImageSrc: "/pics/project-pics/mavrik100.png",
    seedKeys: ["clean-seven-rho.vercel.app"],
    objectPosition: "36% 50%",
  },
  {
    id: "ashkenazi",
    showcaseImageSrc: "/pics/project-pics/ashkenazi.png",
    seedKeys: ["www.ashkenazilaw.co.il", "ashkenazilaw.co.il"],
    objectPosition: "34% 50%",
  },
  {
    id: "noah",
    showcaseImageSrc: "/pics/project-pics/noah.png",
    seedKeys: ["www.noah-sn.co.il", "noah-sn.co.il"],
    objectPosition: "36% 50%",
  },
  {
    id: "ganmetukim",
    showcaseImageSrc: "/pics/project-pics/ganmetukim.png",
    seedKeys: ["ganmetukim.co.il", "www.ganmetukim.co.il"],
    objectPosition: "38% 50%",
  },
  {
    id: "ogen",
    showcaseImageSrc: "/pics/project-pics/ogen.png",
    seedKeys: ["ogen-laneshama.vercel.app"],
    matchProject: isOgenLaneshamaProject,
    objectPosition: "36% 50%",
  },
  {
    id: "shiputi",
    showcaseImageSrc: "/pics/project-pics/shiputi.png",
    seedKeys: ["shiputi.co.il", "www.shiputi.co.il"],
    objectPosition: "34% 50%",
  },
];

export type ProjectsPageGridBatch1CardModel = {
  slotId: ProjectsPageGridBatch1SlotId;
  project: PublicProjectDto;
  showcaseImageSrc: string;
  showcaseImageAlt: string;
  description: string | null;
  tags: string[];
  objectPosition: string;
  ctaLabel: string;
};

function projectSeedKey(project: PublicProjectDto): string | null {
  try {
    return deriveSeedKey(project.projectUrl);
  } catch {
    return null;
  }
}

function normalizeProjectTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ").toLowerCase();
}

function isOgenLaneshamaProject(project: PublicProjectDto): boolean {
  const seedKey = projectSeedKey(project);
  if (seedKey === "ogen-laneshama.vercel.app") {
    return true;
  }

  const normalized = normalizeProjectTitle(project.title);
  if (normalized === "ogen" || normalized === "ogen laneshama") {
    return true;
  }

  const hebrew = project.title.trim();
  return hebrew.includes("עוגן") && /נשמ/i.test(hebrew);
}

function findProjectForSlot(
  projects: PublicProjectDto[],
  slot: Batch1SlotConfig
): PublicProjectDto | undefined {
  for (const key of slot.seedKeys) {
    const match = projects.find((project) => projectSeedKey(project) === key);
    if (match) {
      return match;
    }
  }

  if (slot.matchProject) {
    return projects.find((project) => slot.matchProject!(project));
  }

  return undefined;
}

export function resolveProjectsPageGridBatch1(
  projects: PublicProjectDto[]
): ProjectsPageGridBatch1CardModel[] {
  const cards: ProjectsPageGridBatch1CardModel[] = [];

  for (const slot of BATCH1_SLOTS) {
    const project = findProjectForSlot(projects, slot);
    if (!project) {
      continue;
    }

    cards.push({
      slotId: slot.id,
      project,
      showcaseImageSrc: slot.showcaseImageSrc,
      showcaseImageAlt: project.imageAlt || project.title,
      description: compactFeaturedDescription(
        project.description,
        PROJECTS_PAGE_GRID_BATCH1_MAX_DESCRIPTION_CHARS
      ),
      tags: featuredTagsForProject(project),
      objectPosition: slot.objectPosition,
      ctaLabel: PROJECTS_PAGE_FEATURED_CTA_LABEL,
    });
  }

  return cards;
}

export { BATCH1_SLOTS };

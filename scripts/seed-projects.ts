import { assertDatabaseNameInUri, getSeedEnv } from "@/lib/env";
import { connectDB, disconnectDB } from "@/lib/db/mongoose";
import { deriveSeedKey } from "@/lib/projects/rules";
import { Project } from "@/models/Project";

type SeedProject = {
  title: string;
  subtitle: string;
  projectUrl: string;
  imageFile: string;
  projectsPageOrder: number;
  showOnHome?: boolean;
  homeOrder?: number;
  homeTitle?: string;
  homeSubtitle?: string;
};

const SEED_PROJECTS: SeedProject[] = [
  {
    title: "אטיאס אשכנזי ושות'",
    subtitle: "משרד עורכי דין",
    projectUrl: "https://www.ashkenazilaw.co.il/",
    imageFile: "a-a.png",
    projectsPageOrder: 1,
  },
  {
    title: "זוקו",
    subtitle: "שיעורי ריקוד מקצועיים",
    projectUrl: "https://zoukoisrael.com/",
    imageFile: "zoukopng.png",
    projectsPageOrder: 2,
  },
  {
    title: "עדן - דודי שמש",
    subtitle: "דודי שמש ואינסטלציה",
    projectUrl: "https://www.eden-shemesh.co.il/",
    imageFile: "insta.jpeg",
    projectsPageOrder: 3,
  },
  {
    title: "נזיקי",
    subtitle: "בלוג משפטי בנושא נזיקין",
    projectUrl: "https://www.neziki.org.il/",
    imageFile: "neziki.jpeg",
    projectsPageOrder: 4,
  },
  {
    title: "נוח - סטודנטים לסיעוד",
    subtitle: "סטודנטים לסיעוד",
    projectUrl: "https://www.noah-sn.co.il/",
    imageFile: "noah.jpeg",
    projectsPageOrder: 5,
  },
  {
    title: "jozef la perfume",
    subtitle: "חנות בשמים",
    projectUrl: "https://www.jozeflaperfume.co.il/",
    imageFile: "jozeglaperfume.jpeg",
    projectsPageOrder: 6,
    showOnHome: true,
    homeOrder: 3,
  },
  {
    title: "דיב-דרייב",
    subtitle: "בית ספר לנהיגה",
    projectUrl: "https://driver-lilac.vercel.app/",
    imageFile: "deeb-drive.jpeg",
    projectsPageOrder: 7,
  },
  {
    title: "שיפוטי",
    subtitle: "בלוג משפטי למשרד עורכי דין",
    projectUrl: "https://shiputi.co.il/",
    imageFile: "shiputi.jpeg",
    projectsPageOrder: 8,
    showOnHome: true,
    homeOrder: 1,
    homeTitle: "בלוג משפטי",
  },
  {
    title: "מבריק 100",
    subtitle: "שירותי ניקיון",
    projectUrl: "https://clean-seven-rho.vercel.app/",
    imageFile: "clean.jpeg",
    projectsPageOrder: 9,
    showOnHome: true,
    homeOrder: 4,
    homeSubtitle: "חברת ניקיון",
  },
  {
    title: "lace",
    subtitle: "סוכנות דוגמנות",
    projectUrl: "https://www.lacemodel.com/",
    imageFile: "lace.jpeg",
    projectsPageOrder: 10,
    showOnHome: true,
    homeOrder: 2,
  },
  {
    title: "גן מתוקים",
    subtitle: "גן ילדים - גבעתיים",
    projectUrl: "https://ganmetukim.co.il",
    imageFile: "ganmetukim.png",
    projectsPageOrder: 11,
  },
  {
    title: "נזי שרון",
    subtitle: "מעצבת פנים",
    projectUrl: "https://n-s-tau.vercel000.app/",
    imageFile: "n-s.png",
    projectsPageOrder: 12,
  },
  {
    title: "דור - מאמן כדורסל",
    subtitle: "",
    projectUrl: "https://basketball-umber-theta.vercel.app/",
    imageFile: "pic5.jpeg",
    projectsPageOrder: 13,
  },
];

type SeedSummary = {
  created: number;
  skipped: number;
  conflicts: number;
};

async function seedProjects(): Promise<void> {
  const env = getSeedEnv();
  assertDatabaseNameInUri(env.MONGODB_URI);

  await connectDB();

  const summary: SeedSummary = {
    created: 0,
    skipped: 0,
    conflicts: 0,
  };

  for (const seedProject of SEED_PROJECTS) {
    const seedKey = deriveSeedKey(seedProject.projectUrl);
    const existing = await Project.findOne({ seedKey }).lean();

    const document = {
      title: seedProject.title,
      subtitle: seedProject.subtitle,
      homeTitle: seedProject.homeTitle,
      homeSubtitle: seedProject.homeSubtitle,
      image: {
        url: `/pics/${seedProject.imageFile}`,
        alt: seedProject.title,
      },
      projectUrl: seedProject.projectUrl,
      ctaLabel: "Take me",
      isPublished: true,
      showOnHome: seedProject.showOnHome ?? false,
      showOnProjectsPage: true,
      homeOrder: seedProject.homeOrder ?? 0,
      projectsPageOrder: seedProject.projectsPageOrder,
      technologies: [],
      seedKey,
    };

    if (existing) {
      const hasConflict =
        existing.title !== document.title ||
        existing.subtitle !== document.subtitle ||
        existing.image.url !== document.image.url ||
        existing.projectUrl !== document.projectUrl;

      if (hasConflict) {
        summary.conflicts += 1;
        console.warn(`Conflict for seedKey "${seedKey}" — existing document kept unchanged.`);
      } else {
        summary.skipped += 1;
      }

      continue;
    }

    await Project.create(document);
    summary.created += 1;
  }

  console.log(
    `Projects seed complete: created=${summary.created}, skipped=${summary.skipped}, conflicts=${summary.conflicts}`
  );

  await disconnectDB();
  process.exit(0);
}

seedProjects().catch(async (error) => {
  console.error(`Projects seed failed: ${error instanceof Error ? error.message : String(error)}`);
  await disconnectDB().catch(() => undefined);
  process.exit(1);
});

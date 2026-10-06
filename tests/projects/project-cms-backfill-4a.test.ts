import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getProjectsPageBackfillManifest,
  PROJECTS_PAGE_BACKFILL_TARGET_COUNT,
  PROJECTS_PAGE_BACKFILL_FEATURED_EVOIR_ALT,
} from "../../src/lib/projects/projects-page-backfill-manifest";
import {
  applyBackfillPlan,
  backfillUpdatesFromPlan,
  buildBackfillPlan,
  buildDesiredPatch,
  resolveBackfillMatches,
  type BackfillProjectRecord,
} from "../../src/lib/projects/projects-page-backfill";
import {
  PROJECTS_PAGE_FEATURED_EVOIR_DISPLAY_TITLE,
  PROJECTS_PAGE_FEATURED_EVOIR_IMAGE,
  PROJECTS_PAGE_FEATURED_LACE_DISPLAY_TITLE,
  PROJECTS_PAGE_FEATURED_LACE_IMAGE,
} from "../../src/lib/projects/projectsPageFeatured";
import { BATCH1_SLOTS } from "../../src/lib/projects/projectsPageGridBatch1";

function legacyFixtureSet(): BackfillProjectRecord[] {
  return [
    {
      id: "evoir",
      title: "jozef la perfume",
      projectUrl: "https://www.jozeflaperfume.co.il/",
      seedKey: "jozeflaperfume.co.il",
      imageAlt: "ÉVOIR",
    },
    {
      id: "lace",
      title: "lace",
      projectUrl: "https://www.lacemodel.com/",
      seedKey: "lacemodel.com",
      imageAlt: "Lace",
    },
    {
      id: "zouko",
      title: "זוקו",
      projectUrl: "https://zoukoisrael.com/",
      seedKey: "zoukoisrael.com",
      imageAlt: "זוקו",
    },
    {
      id: "eden",
      title: "עדן - דודי שמש",
      projectUrl: "https://www.eden-shemesh.co.il/",
      seedKey: "eden-shemesh.co.il",
      imageAlt: "עדן",
    },
    {
      id: "mavrik",
      title: "מבריק 100",
      projectUrl: "https://clean-seven-rho.vercel.app/",
      seedKey: "clean-seven-rho.vercel.app",
      imageAlt: "מבריק",
    },
    {
      id: "ashkenazi",
      title: "אטיאס אשכנזי",
      projectUrl: "https://www.ashkenazilaw.co.il/",
      seedKey: "ashkenazilaw.co.il",
      imageAlt: "אשכנזי",
    },
    {
      id: "noah",
      title: "נוח",
      projectUrl: "https://www.noah-sn.co.il/",
      seedKey: "noah-sn.co.il",
      imageAlt: "נוח",
    },
    {
      id: "gan",
      title: "גן מתוקים",
      projectUrl: "https://ganmetukim.co.il/",
      seedKey: "ganmetukim.co.il",
      imageAlt: "גן",
    },
    {
      id: "ogen",
      title: "עוגן לנשמה",
      projectUrl: "https://ogen-laneshama.vercel.app/",
      seedKey: "ogen-laneshama.vercel.app",
      imageAlt: "עוגן",
    },
    {
      id: "shiputi",
      title: "שיפוטי",
      projectUrl: "https://shiputi.co.il/",
      seedKey: "shiputi.co.il",
      imageAlt: "שיפוטי",
    },
    {
      id: "tabi",
      title: "Tabi",
      projectUrl: "https://tabi-example.co.il/",
      projectsPageOrder: 9,
      projectsPageShowcase: {
        url: "https://blob.example/tabi.webp",
        alt: "Tabi",
        storageKey: "projects/tabi/showcase/file.webp",
      },
    },
    {
      id: "neziki",
      title: "נזיקי",
      projectUrl: "https://www.neziki.org.il/",
      seedKey: "neziki.org.il",
      imageAlt: "נזיקי",
    },
  ];
}

describe("Checkpoint 4A — backfill manifest", () => {
  it("defines exactly 10 legacy targets in BATCH1 order for grid", () => {
    const manifest = getProjectsPageBackfillManifest();
    assert.equal(manifest.length, PROJECTS_PAGE_BACKFILL_TARGET_COUNT);

    const grid = manifest.filter((entry) => entry.kind === "grid");
    assert.equal(grid.length, 8);
    assert.deepEqual(
      grid.map((entry) => (entry.kind === "grid" ? entry.slotId : "")),
      BATCH1_SLOTS.map((slot) => slot.id)
    );
    assert.deepEqual(
      grid.map((entry) => (entry.kind === "grid" ? entry.projectsPageOrder : 0)),
      [1, 2, 3, 4, 5, 6, 7, 8]
    );
  });
});

describe("Checkpoint 4A — identity resolution", () => {
  it("resolves all 10 expected legacy projects uniquely", () => {
    const rows = resolveBackfillMatches(legacyFixtureSet());
    assert.equal(rows.length, 10);
    assert.equal(
      rows.filter((row) => row.status !== "missing" && row.status !== "ambiguous").length,
      10
    );
    assert.equal(
      rows.every((row) => row.matchedProjectIds.length === 1),
      true
    );
  });

  it("matches Ogen via URL seedKey and Hebrew title fallback", () => {
    const rows = resolveBackfillMatches([
      {
        id: "ogen-he",
        title: "עוגן לנשמה",
        projectUrl: "https://example.co.il/",
      },
    ]);
    const ogenRow = rows.find(
      (row) => row.target.kind === "grid" && row.target.slotId === "ogen"
    );
    assert.equal(ogenRow?.status, "will_update");
    assert.deepEqual(ogenRow?.matchedProjectIds, ["ogen-he"]);
  });

  it("does not match Featured by title alone without URL identity", () => {
    const rows = resolveBackfillMatches([
      {
        id: "fake-evoir",
        title: "jozef la perfume",
        projectUrl: "https://unrelated.example/",
      },
    ]);
    const evoirRow = rows.find(
      (row) => row.target.kind === "featured" && row.target.slot === "evoir"
    );
    assert.equal(evoirRow?.status, "missing");
  });

  it("aborts when a target is ambiguous", () => {
    const projects = legacyFixtureSet();
    projects.push({
      id: "zouko-dup",
      title: "זוקו 2",
      projectUrl: "https://zoukoisrael.com/",
      seedKey: "zoukoisrael.com",
    });

    const plan = buildBackfillPlan(projects, "dry_run");
    assert.equal(plan.status, "aborted");
    assert.equal(backfillUpdatesFromPlan(plan).length, 0);
  });

  it("aborts when a target is missing", () => {
    const plan = buildBackfillPlan([], "dry_run");
    assert.equal(plan.status, "aborted");
  });
});

describe("Checkpoint 4A — patch and conflicts", () => {
  it("proposes static showcase without storageKey for grid slot", () => {
    const manifest = getProjectsPageBackfillManifest();
    const zoukoTarget = manifest.find(
      (entry) => entry.kind === "grid" && entry.slotId === "zouko"
    );
    assert.ok(zoukoTarget);

    const patch = buildDesiredPatch(
      {
        id: "zouko",
        title: "זוקו",
        projectUrl: "https://zoukoisrael.com/",
        imageAlt: "זוקו",
      },
      zoukoTarget!
    );

    assert.equal(patch.projectsPageShowcase.url, "/pics/project-pics/zuoko.png");
    assert.equal(patch.projectsPageOrder, 1);
    assert.equal("storageKey" in patch.projectsPageShowcase, false);
  });

  it("sets ÉVOIR/Lace Featured metadata from legacy behavior", () => {
    const manifest = getProjectsPageBackfillManifest();
    const evoirTarget = manifest.find(
      (entry) => entry.kind === "featured" && entry.slot === "evoir"
    );
    assert.ok(evoirTarget && evoirTarget.kind === "featured");

    const patch = buildDesiredPatch(
      {
        id: "evoir",
        title: "jozef la perfume",
        projectUrl: "https://www.jozeflaperfume.co.il/",
      },
      evoirTarget
    );

    assert.equal(patch.projectsPageShowcase.url, PROJECTS_PAGE_FEATURED_EVOIR_IMAGE);
    assert.equal(patch.projectsPageShowcase.alt, PROJECTS_PAGE_BACKFILL_FEATURED_EVOIR_ALT);
    assert.equal(patch.projectsPageFeaturedOrder, 1);
    assert.equal(patch.projectsPageDisplayTitle, PROJECTS_PAGE_FEATURED_EVOIR_DISPLAY_TITLE);
    assert.equal(patch.projectsPageShowFeaturedBadge, true);
    assert.equal(patch.projectsPageShowcaseObjectPosition, "28% 50%");
    assert.equal(patch.projectsPageOrder, undefined);

    const laceTarget = manifest.find(
      (entry) => entry.kind === "featured" && entry.slot === "lace"
    );
    assert.ok(laceTarget);
    const lacePatch = buildDesiredPatch(
      { id: "lace", title: "lace", projectUrl: "https://www.lacemodel.com/" },
      laceTarget!
    );
    assert.equal(lacePatch.projectsPageShowcase.url, PROJECTS_PAGE_FEATURED_LACE_IMAGE);
    assert.equal(lacePatch.projectsPageDisplayTitle, PROJECTS_PAGE_FEATURED_LACE_DISPLAY_TITLE);
    assert.equal(lacePatch.projectsPageShowFeaturedBadge, false);
  });

  it("conflicts on managed Blob showcase and does not apply", async () => {
    const projects = legacyFixtureSet();
    const zouko = projects.find((project) => project.id === "zouko")!;
    zouko.projectsPageShowcase = {
      url: "https://blob.example/z.webp",
      alt: "z",
      storageKey: "projects/z/showcase/x.webp",
    };

    const plan = buildBackfillPlan(projects, "apply");
    assert.equal(plan.status, "aborted");

    let writes = 0;
    await applyBackfillPlan(plan, {
      updateProject: async () => {
        writes += 1;
      },
    });
    assert.equal(writes, 0);
  });

  it("conflicts when showcase URL differs from legacy static target", () => {
    const projects = legacyFixtureSet();
    const shiputi = projects.find((project) => project.id === "shiputi")!;
    shiputi.projectsPageShowcase = {
      url: "https://other-static.example/pic.png",
      alt: "x",
    };

    const plan = buildBackfillPlan(projects, "dry_run");
    assert.equal(plan.status, "aborted");
  });
});

describe("Checkpoint 4A — scope safety", () => {
  it("does not target Tabi or hidden projects", () => {
    const plan = buildBackfillPlan(legacyFixtureSet(), "dry_run");
    const touchedIds = new Set(
      plan.rows.flatMap((row) => row.matchedProjectIds)
    );

    assert.equal(touchedIds.has("tabi"), false);
    assert.equal(touchedIds.has("neziki"), false);
    assert.equal(touchedIds.size, 10);
  });

  it("dry-run apply adapter performs zero writes", async () => {
    const plan = buildBackfillPlan(legacyFixtureSet(), "dry_run");
    assert.equal(plan.mode, "dry_run");

    let writes = 0;
    const result = await applyBackfillPlan(plan, {
      updateProject: async () => {
        writes += 1;
      },
    });
    assert.equal(writes, 0);
    assert.equal(result.applied, 0);
  });

  it("apply only updates intended fields on matched legacy rows", async () => {
    const plan = buildBackfillPlan(legacyFixtureSet(), "apply");
    assert.equal(plan.status, "ready");

    const updates = backfillUpdatesFromPlan(plan);
    assert.ok(updates.length > 0);

    const recorded: Array<{ id: string; keys: string[] }> = [];
    await applyBackfillPlan(plan, {
      updateProject: async (input) => {
        recorded.push({
          id: input.projectId,
          keys: Object.keys(input.patch).sort(),
        });
      },
    });

    assert.equal(recorded.some((entry) => entry.id === "tabi"), false);
    for (const entry of recorded) {
      for (const key of entry.keys) {
        assert.ok(
          [
            "projectsPageShowcase",
            "projectsPageShowcaseObjectPosition",
            "projectsPageOrder",
            "featuredOnProjectsPage",
            "projectsPageFeaturedOrder",
            "projectsPageDisplayTitle",
            "projectsPageShowFeaturedBadge",
          ].includes(key)
        );
      }
    }
  });

  it("second run is idempotent when values already match", () => {
    const projects = legacyFixtureSet();
    const manifest = getProjectsPageBackfillManifest();

    for (const project of projects) {
      const row = manifest
        .map((target) => ({
          target,
          patch: buildDesiredPatch(project, target),
          match: resolveBackfillMatches([project]).find(
            (entry) =>
              (entry.target.kind === "featured" &&
                target.kind === "featured" &&
                entry.target.slot === target.slot) ||
              (entry.target.kind === "grid" &&
                target.kind === "grid" &&
                entry.target.slotId === target.slotId)
          ),
        }))
        .filter((entry) => entry.match?.matchedProjectIds[0] === project.id);

      for (const entry of row) {
        if (entry.target.kind === "grid") {
          project.projectsPageOrder = entry.patch.projectsPageOrder;
        }
        if (entry.target.kind === "featured") {
          project.featuredOnProjectsPage = entry.patch.featuredOnProjectsPage;
          project.projectsPageFeaturedOrder = entry.patch.projectsPageFeaturedOrder;
          project.projectsPageDisplayTitle = entry.patch.projectsPageDisplayTitle;
          project.projectsPageShowFeaturedBadge = entry.patch.projectsPageShowFeaturedBadge;
        }
        project.projectsPageShowcase = entry.patch.projectsPageShowcase;
        project.projectsPageShowcaseObjectPosition =
          entry.patch.projectsPageShowcaseObjectPosition;
      }
    }

    const secondPlan = buildBackfillPlan(projects, "apply");
    assert.equal(secondPlan.status, "ready");
    assert.equal(secondPlan.updateCount, 0);
    assert.equal(secondPlan.unchangedCount, 10);
    assert.equal(backfillUpdatesFromPlan(secondPlan).length, 0);
  });
});

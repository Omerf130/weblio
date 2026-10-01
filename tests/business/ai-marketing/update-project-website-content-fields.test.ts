import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildWebsiteContentMongoUpdate,
  updateProjectWebsiteContentFields,
  WEBSITE_CONTENT_FIELD_ALLOWLIST,
} from "../../../src/lib/business/ai-marketing/update-project-website-content-fields";

const validProjectId = "507f1f77bcf86cd799439011";

describe("update project website content fields", () => {
  it("builds $set/$unset only for allowlisted keys", () => {
    const update = buildWebsiteContentMongoUpdate({
      title: "A",
      subtitle: "B",
      description: undefined,
      homeTitle: "H",
      homeSubtitle: undefined,
      technologies: ["Next.js"],
    });

    assert.deepEqual(Object.keys(update.$set).sort(), [
      "homeTitle",
      "subtitle",
      "technologies",
      "title",
    ]);
    assert.deepEqual(Object.keys(update.$unset ?? {}).sort(), [
      "description",
      "homeSubtitle",
    ]);

    for (const key of Object.keys(update.$set)) {
      assert.ok(WEBSITE_CONTENT_FIELD_ALLOWLIST.includes(key as never));
    }
  });

  it("persists edited final values in mongo update", () => {
    const update = buildWebsiteContentMongoUpdate({
      title: "B",
      subtitle: "sub",
      description: "edited",
      technologies: ["EditedTag"],
    });
    assert.deepEqual(update.$set.technologies, ["EditedTag"]);
    assert.equal(update.$set.title, "B");
    assert.equal(update.$set.description, "edited");
  });

  it("includes technologies only from admin-reviewed apply payload", () => {
    const update = buildWebsiteContentMongoUpdate({
      title: "T",
      subtitle: "",
      technologies: ["React", "Edited"],
    });
    assert.deepEqual(update.$set.technologies, ["React", "Edited"]);
  });

  it("never includes image, url, or visibility fields", () => {
    const update = buildWebsiteContentMongoUpdate({
      title: "T",
      subtitle: "",
      technologies: [],
    });
    const allKeys = [
      ...Object.keys(update.$set),
      ...Object.keys(update.$unset ?? {}),
    ];
    for (const forbidden of [
      "imageUrl",
      "image",
      "projectUrl",
      "isPublished",
      "showOnHome",
      "homeOrder",
    ]) {
      assert.ok(!allKeys.includes(forbidden));
    }
  });

  it("rejects invalid project id without touching db", async () => {
    let called = false;
    const result = await updateProjectWebsiteContentFields(
      "not-valid",
      { title: "x", subtitle: "", technologies: [] },
      {
        connectDB: async () => undefined,
        projectExists: async () => {
          called = true;
          return true;
        },
        applyUpdate: async () => true,
        revalidate: () => undefined,
      }
    );
    assert.equal(result.ok, false);
    assert.equal(called, false);
  });

  it("returns not_found when project missing", async () => {
    const result = await updateProjectWebsiteContentFields(
      validProjectId,
      { title: "x", subtitle: "", technologies: [] },
      {
        connectDB: async () => undefined,
        projectExists: async () => false,
        applyUpdate: async () => true,
        revalidate: () => undefined,
      }
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "not_found");
    }
  });

  it("applies atomic update and revalidates", async () => {
    let capturedUpdate: unknown;
    let revalidated = false;

    const result = await updateProjectWebsiteContentFields(
      validProjectId,
      {
        title: "סופי",
        subtitle: "",
        description: "מעודכן",
        technologies: [],
      },
      {
        connectDB: async () => undefined,
        projectExists: async () => true,
        applyUpdate: async (_id, update) => {
          capturedUpdate = update;
          return true;
        },
        revalidate: () => {
          revalidated = true;
        },
      }
    );

    assert.equal(result.ok, true);
    assert.ok(capturedUpdate);
    assert.equal(revalidated, true);
    const update = capturedUpdate as { $set: { title: string } };
    assert.equal(update.$set.title, "סופי");
  });
});

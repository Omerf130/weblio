import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { STATIC_BUILD_YOUR_DREAM_CONTENT } from "../../src/lib/content/build-your-dream/static-content";
import {
  isEditorContentDirty,
  resolveLandingImageUpdate,
} from "../../src/lib/build-your-dream-landing/resolve-landing-image-update";
import {
  enforceLandingCtaActions,
  mergeWithPreservedFields,
  normalizeProcessStepNumbers,
  safeParseBuildYourDreamContent,
} from "../../src/lib/validations/build-your-dream-landing";
import {
  buildLandingImagePathname,
  isManagedLandingImage,
} from "../../src/lib/storage/landing-images";

const existingHero = {
  id: "hero",
  src: "https://blob.example/hero.webp",
  alt: "Saved hero",
  width: 720,
  height: 540,
  priority: true,
  storageKey: "landing/hero.webp",
};

describe("landing image update resolution", () => {
  it("preserves existing hero when no upload and no remove", () => {
    const result = resolveLandingImageUpdate("hero", existingHero, {
      hasNewFile: false,
      removeRequested: false,
    });

    assert.deepEqual(result.image, existingHero);
    assert.equal(result.deleteStorageKey, undefined);
  });

  it("replaces hero when a new file is uploaded", () => {
    const result = resolveLandingImageUpdate("hero", existingHero, {
      hasNewFile: true,
      removeRequested: false,
      uploaded: {
        url: "https://blob.example/hero-new.webp",
        storageKey: "landing/hero-new.webp",
      },
    });

    assert.equal(result.image?.src, "https://blob.example/hero-new.webp");
    assert.equal(result.image?.storageKey, "landing/hero-new.webp");
    assert.equal(result.image?.priority, true);
    assert.equal(result.deleteStorageKey, "landing/hero.webp");
  });

  it("removes hero when explicit remove is requested", () => {
    const result = resolveLandingImageUpdate("hero", existingHero, {
      hasNewFile: false,
      removeRequested: true,
    });

    assert.equal(result.image?.src, STATIC_BUILD_YOUR_DREAM_CONTENT.images.hero.src);
    assert.equal(result.image?.storageKey, undefined);
    assert.equal(result.deleteStorageKey, "landing/hero.webp");
  });

  it("preserves existing splitPrimary when no upload and no remove", () => {
    const existingSplit = {
      id: "split-1",
      src: "https://blob.example/split.webp",
      alt: "Saved split",
      width: 640,
      height: 480,
      storageKey: "landing/split.webp",
    };

    const result = resolveLandingImageUpdate("splitPrimary", existingSplit, {
      hasNewFile: false,
      removeRequested: false,
    });

    assert.deepEqual(result.image, existingSplit);
  });
});

describe("editor dirty baseline", () => {
  it("returns false when content snapshot matches saved snapshot", () => {
    const snapshot = JSON.stringify(STATIC_BUILD_YOUR_DREAM_CONTENT);
    assert.equal(isEditorContentDirty(snapshot, snapshot), false);
  });

  it("returns true when content snapshot differs from saved snapshot", () => {
    const saved = JSON.stringify(STATIC_BUILD_YOUR_DREAM_CONTENT);
    const edited = JSON.stringify({
      ...STATIC_BUILD_YOUR_DREAM_CONTENT,
      hero: {
        ...STATIC_BUILD_YOUR_DREAM_CONTENT.hero,
        title: "Changed title",
      },
    });

    assert.equal(isEditorContentDirty(edited, saved), true);
  });
});

describe("build your dream landing cms validation", () => {
  it("accepts static content shape", () => {
    const parsed = safeParseBuildYourDreamContent(STATIC_BUILD_YOUR_DREAM_CONTENT);
    assert.equal(parsed.success, true);
    assert.match(STATIC_BUILD_YOUR_DREAM_CONTENT.hero.title, /5 טעויות/);
  });

  it("normalizes process step numbers by order", () => {
    const content = structuredClone(STATIC_BUILD_YOUR_DREAM_CONTENT);
    content.process.steps[0]!.stepNumber = 99;
    const normalized = normalizeProcessStepNumbers(content);
    assert.equal(normalized.process.steps[0]?.stepNumber, 1);
    assert.equal(normalized.process.steps[3]?.stepNumber, 4);
  });

  it("preserves hidden lead form fields on merge", () => {
    const editor = structuredClone(STATIC_BUILD_YOUR_DREAM_CONTENT);
    editor.leadForm.title = "Editor title";
    editor.leadForm.fields.name.label = "Changed";
    const merged = mergeWithPreservedFields(editor, STATIC_BUILD_YOUR_DREAM_CONTENT);
    assert.equal(merged.leadForm.title, "Editor title");
    assert.equal(merged.leadForm.fields.name.label, "שם מלא");
  });

  it("enforces scroll-to-form actions on marketing CTAs", () => {
    const content = structuredClone(STATIC_BUILD_YOUR_DREAM_CONTENT);
    content.hero.ctaPrimary.action = "submit";
    const enforced = enforceLandingCtaActions(content);
    assert.equal(enforced.hero.ctaPrimary.action, "scroll-to-form");
  });
});

describe("landing image storage helpers", () => {
  it("builds landing blob pathnames", () => {
    const pathname = buildLandingImagePathname("image/png");
    assert.match(pathname ?? "", /^landing\/.+\.png$/);
  });

  it("detects managed landing storage keys", () => {
    assert.equal(isManagedLandingImage("landing/abc.png"), true);
    assert.equal(isManagedLandingImage("projects/abc.png"), false);
  });
});

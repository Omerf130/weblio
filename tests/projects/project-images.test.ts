import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  IMAGE_MIME_ERROR,
  IMAGE_REQUIRED_ERROR,
  IMAGE_SIZE_ERROR,
  MAX_IMAGE_BYTES,
  validateImageFile,
} from "../../src/lib/storage/image-validation";
import {
  buildProjectImagePathname,
  getImageFileFromFormData,
  isFormDataImageBlob,
  isManagedProjectImage,
  validateProjectImageFile,
} from "../../src/lib/storage/project-images";
import {
  safeParseProjectFields,
  resolveProjectImageAlt,
  validatePublishFields,
} from "../../src/lib/validations/project";

describe("image file validation", () => {
  it("accepts allowed MIME types", () => {
    for (const type of ALLOWED_IMAGE_MIME_TYPES) {
      assert.equal(
        validateImageFile({ type, size: 1024 }),
        null
      );
    }
  });

  it("rejects SVG and other MIME types", () => {
    assert.equal(
      validateImageFile({ type: "image/svg+xml", size: 1024 }),
      IMAGE_MIME_ERROR
    );
    assert.equal(
      validateImageFile({ type: "application/pdf", size: 1024 }),
      IMAGE_MIME_ERROR
    );
  });

  it("rejects files larger than 5MB", () => {
    assert.equal(
      validateImageFile({ type: "image/jpeg", size: MAX_IMAGE_BYTES + 1 }),
      IMAGE_SIZE_ERROR
    );
  });

  it("rejects empty files", () => {
    assert.equal(
      validateImageFile({ type: "image/png", size: 0 }),
      IMAGE_SIZE_ERROR
    );
  });
});

describe("managed project image detection", () => {
  it("treats Blob storage keys as managed", () => {
    assert.equal(
      isManagedProjectImage("projects/abc/def.webp"),
      true
    );
  });

  it("does not treat static /pics paths as managed via storageKey", () => {
    assert.equal(isManagedProjectImage(undefined), false);
    assert.equal(isManagedProjectImage(""), false);
    assert.equal(isManagedProjectImage("/pics/shiputi.jpeg"), false);
  });

  it("builds safe project pathnames from MIME type", () => {
    const pathname = buildProjectImagePathname("project-id", "image/png");
    assert.match(pathname ?? "", /^projects\/project-id\/[a-f0-9-]+\.png$/);
  });
});

describe("FormData image extraction", () => {
  it("accepts Blob-like FormData entries without instanceof File", () => {
    const blobLike = {
      size: 2048,
      type: "image/jpeg",
      arrayBuffer: async () => new ArrayBuffer(0),
    };

    assert.equal(isFormDataImageBlob(blobLike), true);
    assert.equal(validateProjectImageFile(blobLike), null);

    const blob = new Blob([Buffer.alloc(2048)], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("imageFile", blob, "test.jpg");

    const extracted = getImageFileFromFormData(formData);
    assert.ok(extracted);
    assert.equal(extracted.size, 2048);
    assert.equal(extracted.type, "image/jpeg");
  });

  it("rejects missing or empty image files", () => {
    assert.equal(validateProjectImageFile(null), IMAGE_REQUIRED_ERROR);
    assert.equal(
      validateProjectImageFile({ type: "image/png", size: 0 }),
      IMAGE_REQUIRED_ERROR
    );

    const formData = new FormData();
    assert.equal(getImageFileFromFormData(formData), null);
  });
});

describe("project fields validation without manual image URL", () => {
  it("accepts valid project fields without imageAlt", () => {
    const parsed = safeParseProjectFields({
      title: "פרויקט",
      subtitle: "תיאור",
      projectUrl: "https://example.com",
      ctaLabel: "Take me",
      isPublished: true,
      showOnHome: true,
      showOnProjectsPage: true,
      homeOrder: 1,
      projectsPageOrder: 2,
      technologies: "React, Next.js",
    });

    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.technologies.length, 2);
      assert.equal("imageUrl" in parsed.data, false);
      assert.equal(parsed.data.imageAlt, undefined);
    }
  });

  it("rejects non-https project URLs", () => {
    const parsed = safeParseProjectFields({
      title: "פרויקט",
      imageAlt: "פרויקט",
      projectUrl: "http://example.com",
    });

    assert.equal(parsed.success, false);
  });
});

describe("image alt resolution", () => {
  it("uses provided alt text when present", () => {
    assert.equal(resolveProjectImageAlt("תיאור תמונה", "פרויקט"), "תיאור תמונה");
  });

  it("falls back to project title when alt is empty", () => {
    assert.equal(resolveProjectImageAlt("", "פרויקט"), "פרויקט");
    assert.equal(resolveProjectImageAlt(undefined, "פרויקט"), "פרויקט");
  });
});

describe("publish validation with resolved image URL", () => {
  it("accepts publish when resolved Blob URL is provided", () => {
    const error = validatePublishFields({
      title: "פרויקט",
      imageUrl: "https://example.public.blob.vercel-storage.com/projects/id/file.webp",
      projectUrl: "https://example.com",
    });

    assert.equal(error, null);
  });

  it("rejects publish when resolved image URL is empty", () => {
    const error = validatePublishFields({
      title: "פרויקט",
      imageUrl: "",
      projectUrl: "https://example.com",
    });

    assert.equal(error, "תמונת פרויקט נדרשת לפרסום.");
  });
});

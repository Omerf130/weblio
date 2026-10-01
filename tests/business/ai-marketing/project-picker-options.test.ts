import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatProjectPickerLabel,
  mapAdminProjectsToPickerOptions,
} from "../../../src/lib/business/ai-marketing/project-picker-options";
import type { AdminProjectDto } from "../../../src/types/project";

const baseProject: AdminProjectDto = {
  id: "507f1f77bcf86cd799439011",
  title: "אתר לדוגמה",
  subtitle: "עסק מקומי",
  projectUrl: "https://example.com",
  ctaLabel: "Go",
  imageUrl: "https://example.com/i.png",
  imageAlt: "alt",
  imageStorageKey: "secret/key",
  isPublished: false,
  showOnHome: false,
  showOnProjectsPage: true,
  homeOrder: 9,
  projectsPageOrder: 2,
  technologies: ["Next.js", "SCSS"],
  updatedAt: "2026-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("project picker options", () => {
  it("builds human-readable labels without exposing mongo id in label text", () => {
    const label = formatProjectPickerLabel(baseProject);
    assert.equal(label, "אתר לדוגמה - עסק מקומי");
    assert.ok(!label.includes(baseProject.id));
  });

  it("maps admin projects for picker including unpublished", () => {
    const options = mapAdminProjectsToPickerOptions([baseProject]);
    assert.equal(options.length, 1);
    assert.equal(options[0].id, baseProject.id);
    assert.equal(options[0].isPublished, false);
    assert.ok(options[0].detail.includes("לא מפורסם"));
    assert.ok(!options[0].label.includes("507f"));
  });
});

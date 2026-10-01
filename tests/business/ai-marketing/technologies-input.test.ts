import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  commitTechnologiesInput,
  parseTechnologiesFromInput,
} from "../../../src/lib/business/ai-marketing/technologies-input";

describe("technologies input parsing", () => {
  it("parses multiple comma-separated values", () => {
    const list = parseTechnologiesFromInput(
      "Next.js, TypeScript, CMS, Responsive"
    );
    assert.deepEqual(list, ["Next.js", "TypeScript", "CMS", "Responsive"]);
  });

  it("preserves trailing comma while typing via raw string (commit on blur)", () => {
    const raw = "Next.js, TypeScript,";
    assert.equal(raw.endsWith(","), true);
    const committed = commitTechnologiesInput(raw);
    assert.deepEqual(committed.technologies, ["Next.js", "TypeScript"]);
    assert.equal(committed.text, "Next.js, TypeScript");
  });

  it("removes empty segments and normalizes whitespace", () => {
    const list = parseTechnologiesFromInput("  A  ,  , B ,  ");
    assert.deepEqual(list, ["A", "B"]);
  });

  it("deduplicates case-insensitively", () => {
    const list = parseTechnologiesFromInput("React, react, REACT");
    assert.deepEqual(list, ["React"]);
  });

  it("enforces max count and tag length", () => {
    const long = "x".repeat(50);
    const many = Array.from({ length: 25 }, (_, i) => `T${i}`).join(", ");
    const listLong = parseTechnologiesFromInput(long);
    assert.equal(listLong[0]?.length, 40);
    assert.equal(parseTechnologiesFromInput(many).length, 20);
  });
});

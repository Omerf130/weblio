import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readWebsiteCheckJsonBody } from "../../src/lib/website-check/api/read-website-check-json-body";

describe("readWebsiteCheckJsonBody", () => {
  it("rejects bodies larger than the limit", async () => {
    const request = new Request("https://example.com/api/leads/website-check", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "x".repeat(5000),
    });

    const result = await readWebsiteCheckJsonBody(request, 4096);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 413);
    }
  });

  it("parses valid JSON within the limit", async () => {
    const request = new Request("https://example.com/api/leads/website-check", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Test" }),
    });

    const result = await readWebsiteCheckJsonBody(request, 4096);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.body, { name: "Test" });
    }
  });

  it("rejects invalid JSON", async () => {
    const request = new Request("https://example.com/api/leads/website-check", {
      method: "POST",
      body: "{not-json",
    });

    const result = await readWebsiteCheckJsonBody(request, 4096);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 400);
    }
  });
});

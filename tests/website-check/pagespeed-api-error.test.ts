import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractSafePageSpeedApiErrorMessage } from "../../src/lib/website-check/psi/pagespeed-api-error";

describe("extractSafePageSpeedApiErrorMessage", () => {
  it("returns trimmed Google error message", () => {
    const message = extractSafePageSpeedApiErrorMessage({
      error: { message: "Lighthouse returned error: FAILED_DOCUMENT_REQUEST." },
    });
    assert.match(message ?? "", /FAILED_DOCUMENT_REQUEST/);
  });

  it("redacts key= fragments from upstream messages", () => {
    const message = extractSafePageSpeedApiErrorMessage({
      error: { message: "bad request key=secret123 value" },
    });
    assert.match(message ?? "", /key=\[REDACTED\]/);
    assert.doesNotMatch(message ?? "", /secret123/);
  });
});

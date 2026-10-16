import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isWebsiteCheckDevRateLimitBypassEnabled } from "../../src/lib/website-check/rate-limit-dev-bypass";

describe("website check dev rate limit bypass", () => {
  it("is disabled in production even when flag is true", () => {
    assert.equal(
      isWebsiteCheckDevRateLimitBypassEnabled({
        nodeEnv: "production",
        devBypassFlag: "true",
      }),
      false
    );
  });

  it("is disabled in production when flag is unset", () => {
    assert.equal(
      isWebsiteCheckDevRateLimitBypassEnabled({
        nodeEnv: "production",
        devBypassFlag: undefined,
      }),
      false
    );
  });

  it("is disabled in test environment even when flag is true", () => {
    assert.equal(
      isWebsiteCheckDevRateLimitBypassEnabled({
        nodeEnv: "test",
        devBypassFlag: "true",
      }),
      false
    );
  });

  it("is disabled in development without explicit flag", () => {
    assert.equal(
      isWebsiteCheckDevRateLimitBypassEnabled({
        nodeEnv: "development",
        devBypassFlag: undefined,
      }),
      false
    );
  });

  it("is disabled in development when flag is not exactly true", () => {
    assert.equal(
      isWebsiteCheckDevRateLimitBypassEnabled({
        nodeEnv: "development",
        devBypassFlag: "TRUE",
      }),
      false
    );
    assert.equal(
      isWebsiteCheckDevRateLimitBypassEnabled({
        nodeEnv: "development",
        devBypassFlag: "1",
      }),
      false
    );
  });

  it("is enabled only when development and flag is true", () => {
    assert.equal(
      isWebsiteCheckDevRateLimitBypassEnabled({
        nodeEnv: "development",
        devBypassFlag: "true",
      }),
      true
    );
  });

  it("ignores process.env when test passes explicit undefined flag", () => {
    const previous = process.env.WEBSITE_CHECK_DEV_BYPASS_RATE_LIMIT;
    process.env.WEBSITE_CHECK_DEV_BYPASS_RATE_LIMIT = "true";
    try {
      assert.equal(
        isWebsiteCheckDevRateLimitBypassEnabled({
          nodeEnv: "development",
          devBypassFlag: undefined,
        }),
        false
      );
    } finally {
      if (previous === undefined) {
        delete process.env.WEBSITE_CHECK_DEV_BYPASS_RATE_LIMIT;
      } else {
        process.env.WEBSITE_CHECK_DEV_BYPASS_RATE_LIMIT = previous;
      }
    }
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safeParseWebsiteCheckLeadInput } from "../../src/lib/validations/website-check-lead";

describe("websiteCheckLeadInputSchema", () => {
  it("requires name, phone and matching analysis context fields", () => {
    const ok = safeParseWebsiteCheckLeadInput({
      name: "ישראל ישראלי",
      phone: "050-1234567",
      analysisRunId: "507f1f77bcf86cd799439011",
      websiteUrl: "https://example.com/",
    });
    assert.ok(ok.success);

    const missingPhone = safeParseWebsiteCheckLeadInput({
      name: "ישראל",
      phone: "",
      analysisRunId: "507f1f77bcf86cd799439011",
      websiteUrl: "https://example.com/",
    });
    assert.equal(missingPhone.success, false);
  });

  it("rejects honeypot company field", () => {
    const spam = safeParseWebsiteCheckLeadInput({
      name: "Bot",
      phone: "0501234567",
      analysisRunId: "507f1f77bcf86cd799439011",
      websiteUrl: "https://example.com/",
      company: "Acme Inc",
    });
    assert.equal(spam.success, false);
  });
});

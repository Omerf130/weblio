import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  safeParseLeadNotes,
  safeParseLeadStatus,
  safeParseWebsiteLeadInput,
  websiteLeadInputFromFormData,
} from "../../src/lib/validations/lead";

describe("website lead validation", () => {
  it("accepts valid website lead input", () => {
    const parsed = safeParseWebsiteLeadInput({
      name: "ישראל ישראלי",
      phone: "054-4993155",
      email: "test@example.com",
    });

    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.email, "test@example.com");
    }
  });

  it("accepts optional utm fields and drops empty values", () => {
    const parsed = safeParseWebsiteLeadInput({
      name: "ישראל ישראלי",
      phone: "0544993155",
      email: "test@example.com",
      utm_source: "facebook",
      utm_medium: "",
      utm_campaign: "spring",
    });

    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.utm_source, "facebook");
      assert.equal(parsed.data.utm_campaign, "spring");
      assert.equal(parsed.data.utm_medium, undefined);
    }
  });

  it("rejects invalid phone numbers", () => {
    const parsed = safeParseWebsiteLeadInput({
      name: "ישראל",
      phone: "123",
      email: "test@example.com",
    });

    assert.equal(parsed.success, false);
  });

  it("ignores trusted fields from form data", () => {
    const formData = new FormData();
    formData.set("name", "ישראל");
    formData.set("phone", "0544993155");
    formData.set("email", "test@example.com");
    formData.set("status", "closed");
    formData.set("leadNumber", "9999");
    formData.set("source", "landingPage");

    const input = websiteLeadInputFromFormData(formData);
    assert.deepEqual(Object.keys(input).sort(), [
      "email",
      "name",
      "phone",
      "utm_campaign",
      "utm_content",
      "utm_medium",
      "utm_source",
    ]);
  });
});

describe("admin lead validation", () => {
  it("accepts valid lead statuses", () => {
    const parsed = safeParseLeadStatus("contacted");
    assert.equal(parsed.success, true);
  });

  it("rejects invalid lead statuses", () => {
    const parsed = safeParseLeadStatus("converted");
    assert.equal(parsed.success, false);
  });

  it("accepts lead notes up to max length", () => {
    const parsed = safeParseLeadNotes("הערה פנימית");
    assert.equal(parsed.success, true);
  });
});

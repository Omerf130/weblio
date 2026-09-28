import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isValidOpportunityObjectId,
  safeParseCreateOpportunity,
  safeParseUpdateOpportunity,
  safeParseUpdateOpportunityStatus,
} from "../../src/lib/validations/opportunity";

const validBase = {
  title: "עסק חדש בחיפה",
  source: "manual",
  classification: "businessDiscovery",
};

describe("opportunity create validation", () => {
  it("accepts valid create with required fields only", () => {
    const result = safeParseCreateOpportunity(validBase);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.title, validBase.title);
      assert.equal(result.data.internalNotes, "");
      assert.equal(result.data.phone, undefined);
      assert.equal(result.data.email, undefined);
    }
  });

  it("accepts optional phone and email", () => {
    const result = safeParseCreateOpportunity({
      ...validBase,
      phone: "050-1234567",
      email: "Test@Example.com",
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.phone, "050-1234567");
      assert.equal(result.data.email, "test@example.com");
    }
  });

  it("rejects missing title", () => {
    const result = safeParseCreateOpportunity({
      source: "manual",
      classification: "explicitNeed",
    });
    assert.equal(result.success, false);
  });

  it("rejects empty title", () => {
    const result = safeParseCreateOpportunity({
      ...validBase,
      title: "   ",
    });
    assert.equal(result.success, false);
  });

  it("rejects missing source", () => {
    const result = safeParseCreateOpportunity({
      title: "x",
      classification: "explicitNeed",
    });
    assert.equal(result.success, false);
  });

  it("rejects missing classification", () => {
    const result = safeParseCreateOpportunity({
      title: "x",
      source: "manual",
    });
    assert.equal(result.success, false);
  });

  it("rejects invalid email when present", () => {
    const result = safeParseCreateOpportunity({
      ...validBase,
      email: "not-an-email",
    });
    assert.equal(result.success, false);
  });

  it("rejects invalid phone when present", () => {
    const result = safeParseCreateOpportunity({
      ...validBase,
      phone: "abc",
    });
    assert.equal(result.success, false);
  });

  it("rejects non-https sourceUrl", () => {
    const result = safeParseCreateOpportunity({
      ...validBase,
      sourceUrl: "http://example.com",
    });
    assert.equal(result.success, false);
  });

  it("accepts https sourceUrl", () => {
    const result = safeParseCreateOpportunity({
      ...validBase,
      sourceUrl: "https://example.com/post/123",
    });
    assert.equal(result.success, true);
  });

  it("rejects title over 200 characters", () => {
    const result = safeParseCreateOpportunity({
      ...validBase,
      title: "a".repeat(201),
    });
    assert.equal(result.success, false);
  });

  it("does not accept leadId on create schema", () => {
    const result = safeParseCreateOpportunity({
      ...validBase,
      leadId: "507f1f77bcf86cd799439011",
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal("leadId" in result.data, false);
    }
  });
});

describe("opportunity update validation", () => {
  it("rejects converted status in normal status update parser", () => {
    const result = safeParseUpdateOpportunityStatus({ status: "converted" });
    assert.equal(result.success, false);
  });

  it("accepts manual status values", () => {
    for (const status of ["new", "researching", "contacted", "dismissed"] as const) {
      const result = safeParseUpdateOpportunityStatus({ status });
      assert.equal(result.success, true);
    }
  });

  it("update schema matches create field set without conversion fields", () => {
    const result = safeParseUpdateOpportunity({
      ...validBase,
      convertedAt: "2026-01-01T00:00:00.000Z",
      leadId: "507f1f77bcf86cd799439011",
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal("leadId" in result.data, false);
      assert.equal("convertedAt" in result.data, false);
      assert.equal("status" in result.data, false);
    }
  });
});

describe("opportunity object id helper", () => {
  it("validates 24-char hex ObjectIds", () => {
    assert.equal(isValidOpportunityObjectId("507f1f77bcf86cd799439011"), true);
    assert.equal(isValidOpportunityObjectId("xyz"), false);
  });
});

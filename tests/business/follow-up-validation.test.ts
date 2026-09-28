import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  safeParseCreateFollowUp,
  safeParseEditFollowUp,
  safeParseFollowUpStatus,
} from "../../src/lib/validations/follow-up";

describe("follow-up create validation", () => {
  it("accepts valid standalone follow-up", () => {
    const result = safeParseCreateFollowUp({
      title: "התקשר ללקוח",
      dueAt: "2026-10-01T10:00:00.000Z",
    });

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.title, "התקשר ללקוח");
      assert.ok(result.data.dueAt instanceof Date);
      assert.equal(result.data.leadId, undefined);
      assert.equal(result.data.opportunityId, undefined);
    }
  });

  it("accepts follow-up with optional note", () => {
    const result = safeParseCreateFollowUp({
      title: "שליחת הצעת מחיר",
      note: "לשלוח עד יום ראשון",
      dueAt: "2026-10-01T10:00:00.000Z",
    });

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.note, "לשלוח עד יום ראשון");
    }
  });

  it("accepts follow-up linked to a lead", () => {
    const leadId = "507f1f77bcf86cd799439011";
    const result = safeParseCreateFollowUp({
      title: "פולו-אפ ללידים",
      dueAt: "2026-10-05T08:00:00.000Z",
      leadId,
    });

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.leadId, leadId);
    }
  });

  it("accepts follow-up linked to an opportunity", () => {
    const opportunityId = "507f1f77bcf86cd799439012";
    const result = safeParseCreateFollowUp({
      title: "מעקב להזדמנות",
      dueAt: "2026-10-05T08:00:00.000Z",
      opportunityId,
    });

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.opportunityId, opportunityId);
      assert.equal(result.data.leadId, undefined);
    }
  });

  it("rejects follow-up linked to both lead and opportunity", () => {
    const result = safeParseCreateFollowUp({
      title: "בדיקה",
      dueAt: "2026-10-01T10:00:00.000Z",
      leadId: "507f1f77bcf86cd799439011",
      opportunityId: "507f1f77bcf86cd799439012",
    });

    assert.equal(result.success, false);
  });

  it("strips empty note to undefined", () => {
    const result = safeParseCreateFollowUp({
      title: "בדיקה",
      note: "",
      dueAt: "2026-10-01T10:00:00.000Z",
    });

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.note, undefined);
    }
  });

  it("strips empty leadId to undefined", () => {
    const result = safeParseCreateFollowUp({
      title: "בדיקה",
      dueAt: "2026-10-01T10:00:00.000Z",
      leadId: "",
    });

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.leadId, undefined);
    }
  });

  it("rejects missing title", () => {
    const result = safeParseCreateFollowUp({
      dueAt: "2026-10-01T10:00:00.000Z",
    });

    assert.equal(result.success, false);
  });

  it("rejects empty title", () => {
    const result = safeParseCreateFollowUp({
      title: "   ",
      dueAt: "2026-10-01T10:00:00.000Z",
    });

    assert.equal(result.success, false);
  });

  it("rejects title longer than 200 characters", () => {
    const result = safeParseCreateFollowUp({
      title: "א".repeat(201),
      dueAt: "2026-10-01T10:00:00.000Z",
    });

    assert.equal(result.success, false);
  });

  it("rejects note longer than 2000 characters", () => {
    const result = safeParseCreateFollowUp({
      title: "בדיקה",
      note: "א".repeat(2001),
      dueAt: "2026-10-01T10:00:00.000Z",
    });

    assert.equal(result.success, false);
  });

  it("rejects invalid dueAt", () => {
    const result = safeParseCreateFollowUp({
      title: "בדיקה",
      dueAt: "not-a-date",
    });

    assert.equal(result.success, false);
  });

  it("rejects missing dueAt", () => {
    const result = safeParseCreateFollowUp({
      title: "בדיקה",
    });

    assert.equal(result.success, false);
  });

  it("rejects invalid ObjectId for leadId", () => {
    const result = safeParseCreateFollowUp({
      title: "בדיקה",
      dueAt: "2026-10-01T10:00:00.000Z",
      leadId: "not-a-valid-id",
    });

    assert.equal(result.success, false);
  });

  it("rejects invalid ObjectId for opportunityId", () => {
    const result = safeParseCreateFollowUp({
      title: "בדיקה",
      dueAt: "2026-10-01T10:00:00.000Z",
      opportunityId: "xyz",
    });

    assert.equal(result.success, false);
  });
});

describe("follow-up edit validation", () => {
  it("accepts valid edit input", () => {
    const result = safeParseEditFollowUp({
      title: "כותרת מעודכנת",
      dueAt: "2026-11-01T10:00:00.000Z",
    });

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.title, "כותרת מעודכנת");
    }
  });

  it("does not allow leadId change through edit schema", () => {
    const result = safeParseEditFollowUp({
      title: "כותרת",
      dueAt: "2026-11-01T10:00:00.000Z",
      leadId: "507f1f77bcf86cd799439011",
    });

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal("leadId" in result.data, false);
    }
  });
});

describe("follow-up status validation", () => {
  it("accepts pending", () => {
    assert.equal(safeParseFollowUpStatus("pending").success, true);
  });

  it("accepts completed", () => {
    assert.equal(safeParseFollowUpStatus("completed").success, true);
  });

  it("accepts cancelled", () => {
    assert.equal(safeParseFollowUpStatus("cancelled").success, true);
  });

  it("rejects invalid status", () => {
    assert.equal(safeParseFollowUpStatus("archived").success, false);
  });

  it("rejects empty string", () => {
    assert.equal(safeParseFollowUpStatus("").success, false);
  });

  it("rejects non-string", () => {
    assert.equal(safeParseFollowUpStatus(123).success, false);
  });
});

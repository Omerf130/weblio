import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("follow-up status transition logic", () => {
  function applyStatusTransition(
    currentStatus: string,
    newStatus: string,
    currentCompletedAt: Date | null
  ): { status: string; completedAt: Date | null } {
    const update: { status: string; completedAt: Date | null } = {
      status: newStatus,
      completedAt: currentCompletedAt,
    };

    if (newStatus === "completed") {
      update.completedAt = new Date();
    } else {
      update.completedAt = null;
    }

    return update;
  }

  it("sets completedAt when transitioning to completed", () => {
    const before = new Date();
    const result = applyStatusTransition("pending", "completed", null);

    assert.equal(result.status, "completed");
    assert.ok(result.completedAt !== null);
    assert.ok(result.completedAt! >= before);
  });

  it("clears completedAt when reopening to pending", () => {
    const completedAt = new Date("2026-09-01T10:00:00.000Z");
    const result = applyStatusTransition("completed", "pending", completedAt);

    assert.equal(result.status, "pending");
    assert.equal(result.completedAt, null);
  });

  it("does not set completedAt when cancelling from pending", () => {
    const result = applyStatusTransition("pending", "cancelled", null);

    assert.equal(result.status, "cancelled");
    assert.equal(result.completedAt, null);
  });

  it("preserves null completedAt when cancelling from pending", () => {
    const result = applyStatusTransition("pending", "cancelled", null);

    assert.equal(result.completedAt, null);
  });

  it("clears completedAt when cancelling from completed", () => {
    const completedAt = new Date("2026-09-01T10:00:00.000Z");
    const result = applyStatusTransition("completed", "cancelled", completedAt);

    assert.equal(result.status, "cancelled");
    assert.equal(result.completedAt, null);
  });

  it("clears completedAt when reopening cancelled to pending", () => {
    const result = applyStatusTransition("cancelled", "pending", null);

    assert.equal(result.status, "pending");
    assert.equal(result.completedAt, null);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { qualificationAnswersSchema } from "../../src/lib/validations/lead";

describe("lead qualification validation", () => {
  it("accepts flexible qualification answers", () => {
    const parsed = qualificationAnswersSchema.safeParse([
      {
        key: "budget",
        question: "מה התקציב?",
        answer: "5000-10000",
      },
      {
        key: "timeline",
        question: "מתי תרצו להתחיל?",
        answer: "בחודש הקרוב",
      },
    ]);

    assert.equal(parsed.success, true);
  });

  it("rejects empty qualification answers", () => {
    const parsed = qualificationAnswersSchema.safeParse([
      {
        key: "",
        question: "שאלה",
        answer: "תשובה",
      },
    ]);

    assert.equal(parsed.success, false);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getBuildYourDreamContent } from "../../src/lib/content/build-your-dream/get-build-your-dream-content";
import {
  createLeadCompletionToken,
  verifyLeadCompletionToken,
} from "../../src/lib/leads/completion-token";
import {
  buildLeadQualificationInputSchema,
  landingPageLeadInputFromFormData,
  safeParseLandingPageLeadInput,
} from "../../src/lib/validations/lead";

describe("build your dream content provider", () => {
  it("returns landing content with three qualification questions", async () => {
    const content = await getBuildYourDreamContent();
    assert.equal(content.thankYou.qualification.questions.length, 3);
    assert.equal(content.thankYou.qualification.questions[0]?.type, "text");
    assert.match(content.thankYou.title, /כמעט/);
  });
});

describe("landing page lead validation", () => {
  it("accepts optional message field", () => {
    const parsed = safeParseLandingPageLeadInput({
      name: "Test User",
      phone: "0544993155",
      email: "test@example.com",
      message: "Hello",
    });
    assert.equal(parsed.success, true);
  });

  it("ignores spoofed trusted fields in form data", () => {
    const formData = new FormData();
    formData.set("name", "Test");
    formData.set("phone", "0544993155");
    formData.set("email", "test@example.com");
    formData.set("source", "website");
    formData.set("leadNumber", "999");

    const input = landingPageLeadInputFromFormData(formData);
    assert.equal("source" in input, false);
    assert.equal("leadNumber" in input, false);
  });
});

describe("lead qualification validation", () => {
  it("validates required qualification answers", () => {
    const questions = [
      {
        id: "question_1",
        type: "text" as const,
        question: "Q1",
        required: true,
      },
      {
        id: "question_2",
        type: "text" as const,
        question: "Q2",
        required: false,
      },
    ];

    const schema = buildLeadQualificationInputSchema(questions);
    const parsed = schema.safeParse({
      question_1: "Answer",
      question_2: "",
    });

    assert.equal(parsed.success, true);
  });
});

describe("lead completion token", () => {
  it("signs and verifies a lead token", () => {
    process.env.LEAD_COMPLETION_SECRET = "test-secret";
    const token = createLeadCompletionToken("507f1f77bcf86cd799439011");
    const verified = verifyLeadCompletionToken(token);
    assert.equal(verified?.leadId, "507f1f77bcf86cd799439011");
  });
});

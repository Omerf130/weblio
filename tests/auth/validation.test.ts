import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseLoginInput,
  safeParseLoginInput,
} from "../../src/lib/validations/auth.ts";

describe("login validation", () => {
  it("normalizes email to lowercase and trims", () => {
    const result = parseLoginInput({
      email: "  Admin@Example.COM  ",
      password: "secret123",
    });

    assert.equal(result.email, "admin@example.com");
    assert.equal(result.password, "secret123");
  });

  it("rejects invalid email via safeParse", () => {
    const result = safeParseLoginInput({
      email: "not-an-email",
      password: "secret123",
    });

    assert.equal(result.success, false);
  });

  it("rejects empty password via safeParse", () => {
    const result = safeParseLoginInput({
      email: "admin@example.com",
      password: "",
    });

    assert.equal(result.success, false);
  });
});

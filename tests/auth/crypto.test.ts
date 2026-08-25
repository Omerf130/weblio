import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateSessionToken,
  hashSessionToken,
} from "../../src/lib/auth/crypto.ts";

describe("session crypto", () => {
  it("generates a 64-char hex token", () => {
    const token = generateSessionToken();
    assert.match(token, /^[a-f0-9]{64}$/);
  });

  it("hashes tokens deterministically", () => {
    const token = "sample-token-value";
    const first = hashSessionToken(token);
    const second = hashSessionToken(token);

    assert.equal(first, second);
    assert.notEqual(first, token);
    assert.match(first, /^[a-f0-9]{64}$/);
  });
});

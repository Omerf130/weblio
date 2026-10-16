import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hashWebsiteCheckClientKey,
  resolveWebsiteCheckClientKey,
} from "../../src/lib/website-check/client-identity";

function requestWithHeaders(headers: Record<string, string>): Request {
  return new Request("https://example.com/api/website-check/runs", { headers });
}

describe("resolveWebsiteCheckClientKey", () => {
  it("uses x-vercel-forwarded-for on Vercel", () => {
    const previous = process.env.VERCEL;
    process.env.VERCEL = "1";
    try {
      const key = resolveWebsiteCheckClientKey(
        requestWithHeaders({ "x-vercel-forwarded-for": "203.0.113.10, 10.0.0.1" })
      );
      assert.equal(key, hashWebsiteCheckClientKey("ip:203.0.113.10"));
    } finally {
      if (previous === undefined) {
        delete process.env.VERCEL;
      } else {
        process.env.VERCEL = previous;
      }
    }
  });

  it("does not trust spoofed x-forwarded-for on Vercel when platform header is missing", () => {
    const previous = process.env.VERCEL;
    process.env.VERCEL = "1";
    try {
      const key = resolveWebsiteCheckClientKey(
        requestWithHeaders({ "x-forwarded-for": "198.51.100.99" })
      );
      assert.equal(key, hashWebsiteCheckClientKey("anonymous"));
    } finally {
      if (previous === undefined) {
        delete process.env.VERCEL;
      } else {
        process.env.VERCEL = previous;
      }
    }
  });

  it("prefers platform header over x-forwarded-for on Vercel", () => {
    const previous = process.env.VERCEL;
    process.env.VERCEL = "1";
    try {
      const key = resolveWebsiteCheckClientKey(
        requestWithHeaders({
          "x-vercel-forwarded-for": "203.0.113.20",
          "x-forwarded-for": "198.51.100.99",
        })
      );
      assert.equal(key, hashWebsiteCheckClientKey("ip:203.0.113.20"));
    } finally {
      if (previous === undefined) {
        delete process.env.VERCEL;
      } else {
        process.env.VERCEL = previous;
      }
    }
  });

  it("uses x-real-ip outside Vercel", () => {
    const previous = process.env.VERCEL;
    delete process.env.VERCEL;
    try {
      const key = resolveWebsiteCheckClientKey(requestWithHeaders({ "x-real-ip": "192.0.2.44" }));
      assert.equal(key, hashWebsiteCheckClientKey("ip:192.0.2.44"));
    } finally {
      if (previous !== undefined) {
        process.env.VERCEL = previous;
      }
    }
  });

  it("falls back to anonymous when no trusted IP is available", () => {
    const previous = process.env.VERCEL;
    process.env.VERCEL = "1";
    try {
      const key = resolveWebsiteCheckClientKey(requestWithHeaders({}));
      assert.equal(key, hashWebsiteCheckClientKey("anonymous"));
    } finally {
      if (previous === undefined) {
        delete process.env.VERCEL;
      } else {
        process.env.VERCEL = previous;
      }
    }
  });
});

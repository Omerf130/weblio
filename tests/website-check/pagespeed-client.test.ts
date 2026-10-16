import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fetchMobilePageSpeedInsights } from "../../src/lib/website-check/psi/pagespeed-fetch";
import {
  buildPageSpeedInsightsRequestUrl,
  redactPageSpeedRequestUrl,
} from "../../src/lib/website-check/psi/pagespeed-request";
import { PSI_FIXTURE_COMPLETE } from "./psi-fixtures";

describe("pagespeed request URL", () => {
  it("includes mobile strategy and all categories", () => {
    const url = buildPageSpeedInsightsRequestUrl({
      url: "https://example.com/",
      apiKey: "secret-key",
    });
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("strategy"), "mobile");
    assert.equal(parsed.searchParams.get("url"), "https://example.com/");
    assert.equal(parsed.searchParams.getAll("category").sort().join(","), [
      "accessibility",
      "best-practices",
      "performance",
      "seo",
    ].sort().join(","));
    assert.equal(parsed.searchParams.get("key"), "secret-key");
  });

  it("redacts API key from URLs", () => {
    const raw = buildPageSpeedInsightsRequestUrl({
      url: "https://example.com/",
      apiKey: "secret-key",
    });
    const redacted = redactPageSpeedRequestUrl(raw);
    assert.doesNotMatch(redacted, /secret-key/);
    assert.equal(new URL(redacted).searchParams.get("key"), "[REDACTED]");
  });
});

describe("fetchMobilePageSpeedInsights", () => {
  it("returns parsed JSON on success", async () => {
    const fetchImpl = async () =>
      new Response(JSON.stringify(PSI_FIXTURE_COMPLETE), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    const result = await fetchMobilePageSpeedInsights({
      url: "https://example.com/",
      apiKey: "test-key",
      timeoutMs: 5_000,
      fetchImpl,
    });

    assert.equal(result.ok, true);
  });

  it("maps 429 to rate limit error", async () => {
    const fetchImpl = async () => new Response("rate limited", { status: 429 });
    const result = await fetchMobilePageSpeedInsights({
      url: "https://example.com/",
      apiKey: "test-key",
      timeoutMs: 5_000,
      fetchImpl,
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.code, "psi_rate_limited");
  });

  it("maps 400 to client error with safe upstream message", async () => {
    const fetchImpl = async () =>
      new Response(
        JSON.stringify({
          error: {
            message:
              "Lighthouse returned error: FAILED_DOCUMENT_REQUEST. Details: net::ERR_CONNECTION_FAILED",
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    const result = await fetchMobilePageSpeedInsights({
      url: "https://www.shiputi.co.il/",
      apiKey: "test-key",
      timeoutMs: 5_000,
      fetchImpl,
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.code, "psi_client_error");
    assert.equal(result.httpStatus, 400);
    assert.match(result.upstreamMessage ?? "", /FAILED_DOCUMENT_REQUEST/);
    assert.match(result.messagePublic, /שירות הבדיקה/);
    assert.doesNotMatch(result.messagePublic, /FAILED_DOCUMENT_REQUEST/);
  });

  it("maps 5xx to server error", async () => {
    const fetchImpl = async () => new Response("error", { status: 503 });
    const result = await fetchMobilePageSpeedInsights({
      url: "https://example.com/",
      apiKey: "test-key",
      timeoutMs: 5_000,
      fetchImpl,
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.code, "psi_server_error");
  });

  it("maps invalid JSON to invalid response", async () => {
    const fetchImpl = async () =>
      new Response("not-json", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    const result = await fetchMobilePageSpeedInsights({
      url: "https://example.com/",
      apiKey: "test-key",
      timeoutMs: 5_000,
      fetchImpl,
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.code, "psi_invalid_response");
  });

  it("maps abort to timeout", async () => {
    const fetchImpl = async (_input: RequestInfo | URL, init?: RequestInit) => {
      const signal = init?.signal;
      return await new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener("abort", () => {
          const error = new Error("Aborted");
          error.name = "AbortError";
          reject(error);
        });
      });
    };

    const result = await fetchMobilePageSpeedInsights({
      url: "https://example.com/",
      apiKey: "test-key",
      timeoutMs: 20,
      fetchImpl,
    });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.code, "psi_timeout");
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validatePublicWebsiteUrl } from "../../src/lib/website-check/validate-public-url";

describe("validatePublicWebsiteUrl", () => {
  it("rejects empty input", () => {
    const result = validatePublicWebsiteUrl("   ");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "empty");
    }
  });

  it("normalizes bare domains to https", () => {
    const result = validatePublicWebsiteUrl("example.com");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.normalized, "https://example.com/");
      assert.equal(result.hostname, "example.com");
    }
  });

  it("accepts public https URLs with path", () => {
    const result = validatePublicWebsiteUrl("https://www.weblio.co.il/services");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.normalized, "https://www.weblio.co.il/services");
    }
  });

  it("rejects localhost", () => {
    const result = validatePublicWebsiteUrl("http://localhost:3000");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "internal_host");
    }
  });

  it("rejects private IPv4", () => {
    const result = validatePublicWebsiteUrl("https://192.168.1.1/");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "private_ip");
    }
  });

  it("rejects loopback IPv4", () => {
    const result = validatePublicWebsiteUrl("https://127.0.0.1/admin");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "private_ip");
    }
  });

  it("rejects link-local IPv4", () => {
    const result = validatePublicWebsiteUrl("http://169.254.169.254/latest/meta-data");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "private_ip");
    }
  });

  it("rejects credentials in URL", () => {
    const result = validatePublicWebsiteUrl("https://user:pass@example.com/");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "credentials");
    }
  });

  it("rejects non-default ports", () => {
    const result = validatePublicWebsiteUrl("https://example.com:8080/");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "disallowed_port");
    }
  });

  it("rejects non-http schemes", () => {
    const result = validatePublicWebsiteUrl("ftp://example.com");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "unsupported_protocol");
    }
  });

  it("rejects single-label hostnames", () => {
    const result = validatePublicWebsiteUrl("https://intranet/");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "disallowed_host");
    }
  });

  it("rejects internal suffix hosts", () => {
    const result = validatePublicWebsiteUrl("https://app.internal/");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "internal_host");
    }
  });

  it("allows explicit port 443 on https", () => {
    const result = validatePublicWebsiteUrl("https://example.com:443/path");
    assert.equal(result.ok, true);
  });
});

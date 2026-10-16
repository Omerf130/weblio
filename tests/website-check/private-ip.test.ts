import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isPrivateOrReservedIPv4,
  isPrivateOrReservedIPv6,
} from "../../src/lib/website-check/private-ip";

describe("private IP helpers", () => {
  it("detects common private IPv4 ranges", () => {
    assert.equal(isPrivateOrReservedIPv4("10.0.0.1"), true);
    assert.equal(isPrivateOrReservedIPv4("172.16.0.1"), true);
    assert.equal(isPrivateOrReservedIPv4("192.168.0.1"), true);
    assert.equal(isPrivateOrReservedIPv4("8.8.8.8"), false);
  });

  it("detects loopback and link-local IPv6", () => {
    assert.equal(isPrivateOrReservedIPv6("::1"), true);
    assert.equal(isPrivateOrReservedIPv6("fe80::1"), true);
    assert.equal(isPrivateOrReservedIPv6("2001:4860:4860::8888"), false);
  });
});

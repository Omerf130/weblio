import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  assertBlobCredentials,
  BLOB_UNAVAILABLE_ERROR,
  BlobStorageError,
  getBlobAuthMode,
  getBlobReadWriteToken,
  hasBlobCredentials,
  hasBlobOidcCredentials,
  isBlobOidcEnvironmentError,
} from "../../src/lib/storage/blob-config";

const originalEnv = {
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  VERCEL_OIDC_TOKEN: process.env.VERCEL_OIDC_TOKEN,
  BLOB_STORE_ID: process.env.BLOB_STORE_ID,
};

function setEnv(key: keyof typeof originalEnv, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

function clearBlobEnv(): void {
  delete process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.VERCEL_OIDC_TOKEN;
  delete process.env.BLOB_STORE_ID;
}

afterEach(() => {
  for (const key of Object.keys(originalEnv) as Array<keyof typeof originalEnv>) {
    setEnv(key, originalEnv[key]);
  }
});

describe("Blob static token configuration", () => {
  it("treats empty BLOB_READ_WRITE_TOKEN as missing", () => {
    clearBlobEnv();
    process.env.BLOB_READ_WRITE_TOKEN = "";
    assert.equal(getBlobReadWriteToken(), null);
  });

  it("treats whitespace-only BLOB_READ_WRITE_TOKEN as missing", () => {
    clearBlobEnv();
    process.env.BLOB_READ_WRITE_TOKEN = "   ";
    assert.equal(getBlobReadWriteToken(), null);
  });

  it("treats [SENSITIVE] BLOB_READ_WRITE_TOKEN as missing", () => {
    clearBlobEnv();
    process.env.BLOB_READ_WRITE_TOKEN = "[SENSITIVE]";
    assert.equal(getBlobReadWriteToken(), null);
  });

  it("returns trimmed token when configured", () => {
    clearBlobEnv();
    process.env.BLOB_READ_WRITE_TOKEN = "  test-token  ";
    assert.equal(getBlobReadWriteToken(), "test-token");
  });
});

describe("Blob OIDC credential detection", () => {
  it("detects valid OIDC environment", () => {
    clearBlobEnv();
    process.env.VERCEL_OIDC_TOKEN = "oidc-token";
    process.env.BLOB_STORE_ID = "store_abc123";

    assert.equal(hasBlobOidcCredentials(), true);
    assert.equal(getBlobAuthMode(), "oidc");
    assert.equal(hasBlobCredentials(), true);
  });

  it("prefers static token when both OIDC and read-write token exist", () => {
    clearBlobEnv();
    process.env.BLOB_READ_WRITE_TOKEN = "static-token";
    process.env.VERCEL_OIDC_TOKEN = "oidc-token";
    process.env.BLOB_STORE_ID = "store_abc123";

    assert.equal(getBlobAuthMode(), "readWriteToken");
    assert.equal(hasBlobCredentials(), true);
  });

  it("uses OIDC when static token is empty", () => {
    clearBlobEnv();
    process.env.BLOB_READ_WRITE_TOKEN = "";
    process.env.VERCEL_OIDC_TOKEN = "oidc-token";
    process.env.BLOB_STORE_ID = "store_abc123";

    assert.equal(getBlobAuthMode(), "oidc");
    assert.equal(hasBlobCredentials(), true);
  });

  it("uses OIDC when static token is [SENSITIVE]", () => {
    clearBlobEnv();
    process.env.BLOB_READ_WRITE_TOKEN = "[SENSITIVE]";
    process.env.VERCEL_OIDC_TOKEN = "oidc-token";
    process.env.BLOB_STORE_ID = "store_abc123";

    assert.equal(getBlobAuthMode(), "oidc");
    assert.equal(hasBlobCredentials(), true);
  });

  it("uses static token when OIDC is unavailable", () => {
    clearBlobEnv();
    process.env.BLOB_READ_WRITE_TOKEN = "static-token";

    assert.equal(hasBlobOidcCredentials(), false);
    assert.equal(getBlobAuthMode(), "readWriteToken");
    assert.equal(hasBlobCredentials(), true);
  });

  it("reports no credentials when everything is missing", () => {
    clearBlobEnv();

    assert.equal(getBlobAuthMode(), "none");
    assert.equal(hasBlobCredentials(), false);
  });

  it("reports no credentials when OIDC is incomplete", () => {
    clearBlobEnv();
    process.env.VERCEL_OIDC_TOKEN = "oidc-token";

    assert.equal(hasBlobOidcCredentials(), false);
    assert.equal(getBlobAuthMode(), "none");
  });

  it("throws a dev-facing error when no credentials are available", () => {
    clearBlobEnv();

    assert.throws(
      () => assertBlobCredentials(),
      (error: unknown) => {
        assert.ok(error instanceof BlobStorageError);
        assert.equal(error.message, BLOB_UNAVAILABLE_ERROR);
        assert.equal(
          error.message,
          "חסר חיבור ל-Vercel Blob בסביבת הפיתוח."
        );
        return true;
      }
    );
  });

  it("detects Vercel Blob OIDC development environment errors", () => {
    assert.equal(
      isBlobOidcEnvironmentError(
        new Error(
          'Vercel Blob: OIDC is enabled for this project, but not for the "development" environment.'
        )
      ),
      true
    );
    assert.equal(isBlobOidcEnvironmentError(new Error("other error")), false);
  });
});

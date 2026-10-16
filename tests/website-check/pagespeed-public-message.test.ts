import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PSI_FAILED_DOCUMENT_REQUEST_PUBLIC_MESSAGE } from "../../src/lib/website-check/psi/pagespeed-api-error";
import {
  pageSpeedFailure,
  PSI_PUBLIC_ERROR_MESSAGES,
  resolvePageSpeedPublicMessage,
} from "../../src/lib/website-check/psi/pagespeed-errors";

describe("resolvePageSpeedPublicMessage", () => {
  it("maps FAILED_DOCUMENT_REQUEST upstream to friendly Hebrew", () => {
    const message = resolvePageSpeedPublicMessage({
      code: "psi_client_error",
      messagePublic: PSI_PUBLIC_ERROR_MESSAGES.psi_client_error,
      upstreamMessage: "Lighthouse returned error: FAILED_DOCUMENT_REQUEST.",
    });
    assert.equal(message, PSI_FAILED_DOCUMENT_REQUEST_PUBLIC_MESSAGE);
  });

  it("keeps generic client error without document-request signal", () => {
    const message = resolvePageSpeedPublicMessage({
      code: "psi_client_error",
      messagePublic: PSI_PUBLIC_ERROR_MESSAGES.psi_client_error,
      upstreamMessage: "Invalid URL format",
    });
    assert.equal(message, PSI_PUBLIC_ERROR_MESSAGES.psi_client_error);
  });

  it("pageSpeedFailure applies resolved message", () => {
    const failure = pageSpeedFailure("psi_client_error", {
      httpStatus: 400,
      upstreamMessage: "FAILED_DOCUMENT_REQUEST",
    });
    assert.equal(failure.messagePublic, PSI_FAILED_DOCUMENT_REQUEST_PUBLIC_MESSAGE);
  });
});

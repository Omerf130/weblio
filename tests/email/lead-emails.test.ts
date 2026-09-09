import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach, mock } from "node:test";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { AdminLeadDetailDto } from "../../src/types/lead";
import {
  getResendClient,
  _resetClientForTesting,
} from "../../src/lib/email/resend";
import {
  sendGuideEmail,
  sendLeadNotificationEmail,
  sendLandingLeadEmails,
} from "../../src/lib/email/lead-emails";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../..");

const FAKE_LEAD: AdminLeadDetailDto = {
  id: "507f1f77bcf86cd799439011",
  leadNumber: 1042,
  name: "Test User",
  phone: "0544993155",
  email: "visitor@example.com",
  source: "landingPage",
  status: "new",
  isRead: false,
  createdAt: new Date().toISOString(),
  message: "I need a website",
  sourcePage: "/build-your-dream",
  internalNotes: "",
  qualificationStatus: "pending",
  updatedAt: new Date().toISOString(),
  utm_source: "facebook",
  utm_medium: "cpc",
  utm_campaign: "summer2026",
};

describe("resend client", () => {
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env.RESEND_API_KEY;
    _resetClientForTesting();
  });

  afterEach(() => {
    if (originalKey !== undefined) {
      process.env.RESEND_API_KEY = originalKey;
    } else {
      delete process.env.RESEND_API_KEY;
    }
    _resetClientForTesting();
  });

  it("returns null when RESEND_API_KEY is missing", () => {
    delete process.env.RESEND_API_KEY;
    const client = getResendClient();
    assert.equal(client, null);
  });

  it("returns a Resend instance when RESEND_API_KEY is set", () => {
    process.env.RESEND_API_KEY = "re_test_fake_key";
    const client = getResendClient();
    assert.ok(client !== null);
  });

  it("returns the same instance on repeated calls", () => {
    process.env.RESEND_API_KEY = "re_test_fake_key";
    const a = getResendClient();
    const b = getResendClient();
    assert.equal(a, b);
  });
});

describe("sendGuideEmail", () => {
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env.RESEND_API_KEY;
    _resetClientForTesting();
    process.env.RESEND_API_KEY = "re_test_fake_key";
  });

  afterEach(() => {
    if (originalKey !== undefined) {
      process.env.RESEND_API_KEY = originalKey;
    } else {
      delete process.env.RESEND_API_KEY;
    }
    _resetClientForTesting();
    mock.restoreAll();
  });

  it("sends email to the submitted visitor email with PDF attachment", async () => {
    const client = getResendClient()!;
    const mockSend = mock.method(
      client.emails,
      "send",
      async () => ({ data: { id: "mock-id" }, error: null })
    );

    const result = await sendGuideEmail("visitor@example.com", "Test User");

    assert.equal(result.success, true);
    assert.equal(mockSend.mock.calls.length, 1);

    const callArgs = mockSend.mock.calls[0]!.arguments[0] as Record<
      string,
      unknown
    >;
    assert.equal(callArgs.to, "visitor@example.com");
    assert.equal(callArgs.from, "Weblio <hello@weblio.co.il>");
    assert.ok(typeof callArgs.subject === "string");
    assert.ok(typeof callArgs.html === "string");
    assert.ok((callArgs.html as string).includes("Test"));

    const attachments = callArgs.attachments as Array<{
      filename: string;
      content: Buffer;
    }>;
    assert.equal(attachments.length, 1);
    assert.equal(
      attachments[0]!.filename,
      "weblio-5-website-mistakes-guide.pdf"
    );
    assert.ok(Buffer.isBuffer(attachments[0]!.content));
    assert.ok(attachments[0]!.content.length > 0);
  });

  it("returns error when Resend API returns an error", async () => {
    const client = getResendClient()!;
    mock.method(client.emails, "send", async () => ({
      data: null,
      error: { message: "Resend API error", name: "validation_error" },
    }));

    const result = await sendGuideEmail("visitor@example.com", "Test User");

    assert.equal(result.success, false);
    assert.ok(result.error);
  });

  it("handles thrown errors gracefully", async () => {
    const client = getResendClient()!;
    mock.method(client.emails, "send", async () => {
      throw new Error("Network failure");
    });

    const result = await sendGuideEmail("visitor@example.com", "Test User");

    assert.equal(result.success, false);
    assert.equal(result.error, "Network failure");
  });

  it("returns error when RESEND_API_KEY is missing", async () => {
    _resetClientForTesting();
    delete process.env.RESEND_API_KEY;

    const result = await sendGuideEmail("visitor@example.com", "Test User");

    assert.equal(result.success, false);
    assert.ok(result.error?.includes("not configured"));
  });
});

describe("sendLeadNotificationEmail", () => {
  let originalKey: string | undefined;
  let originalNotif: string | undefined;

  beforeEach(() => {
    originalKey = process.env.RESEND_API_KEY;
    originalNotif = process.env.LEAD_NOTIFICATION_EMAIL;
    _resetClientForTesting();
    process.env.RESEND_API_KEY = "re_test_fake_key";
    process.env.LEAD_NOTIFICATION_EMAIL = "owner@example.com";
  });

  afterEach(() => {
    if (originalKey !== undefined) {
      process.env.RESEND_API_KEY = originalKey;
    } else {
      delete process.env.RESEND_API_KEY;
    }
    if (originalNotif !== undefined) {
      process.env.LEAD_NOTIFICATION_EMAIL = originalNotif;
    } else {
      delete process.env.LEAD_NOTIFICATION_EMAIL;
    }
    _resetClientForTesting();
    mock.restoreAll();
  });

  it("sends notification to LEAD_NOTIFICATION_EMAIL with lead data", async () => {
    const client = getResendClient()!;
    const mockSend = mock.method(
      client.emails,
      "send",
      async () => ({ data: { id: "mock-id" }, error: null })
    );

    const result = await sendLeadNotificationEmail(FAKE_LEAD);

    assert.equal(result.success, true);
    assert.equal(mockSend.mock.calls.length, 1);

    const callArgs = mockSend.mock.calls[0]!.arguments[0] as Record<
      string,
      unknown
    >;
    assert.equal(callArgs.to, "owner@example.com");
    assert.equal(callArgs.from, "Weblio <hello@weblio.co.il>");

    const html = callArgs.html as string;
    assert.ok(html.includes("Test User"));
    assert.ok(html.includes("visitor@example.com"));
    assert.ok(html.includes("0544993155"));
    assert.ok(html.includes("#1042"));
    assert.ok(html.includes("I need a website"));
    assert.ok(html.includes("facebook"));
  });

  it("skips when LEAD_NOTIFICATION_EMAIL is not set", async () => {
    delete process.env.LEAD_NOTIFICATION_EMAIL;

    const result = await sendLeadNotificationEmail(FAKE_LEAD);

    assert.equal(result.success, false);
    assert.ok(result.error?.includes("LEAD_NOTIFICATION_EMAIL"));
  });

  it("returns error when Resend API returns an error", async () => {
    const client = getResendClient()!;
    mock.method(client.emails, "send", async () => ({
      data: null,
      error: { message: "rate limit exceeded", name: "rate_limit_error" },
    }));

    const result = await sendLeadNotificationEmail(FAKE_LEAD);

    assert.equal(result.success, false);
    assert.ok(result.error);
  });
});

describe("sendLandingLeadEmails (orchestrator)", () => {
  let originalKey: string | undefined;
  let originalNotif: string | undefined;

  beforeEach(() => {
    originalKey = process.env.RESEND_API_KEY;
    originalNotif = process.env.LEAD_NOTIFICATION_EMAIL;
    _resetClientForTesting();
    process.env.RESEND_API_KEY = "re_test_fake_key";
    process.env.LEAD_NOTIFICATION_EMAIL = "owner@example.com";
  });

  afterEach(() => {
    if (originalKey !== undefined) {
      process.env.RESEND_API_KEY = originalKey;
    } else {
      delete process.env.RESEND_API_KEY;
    }
    if (originalNotif !== undefined) {
      process.env.LEAD_NOTIFICATION_EMAIL = originalNotif;
    } else {
      delete process.env.LEAD_NOTIFICATION_EMAIL;
    }
    _resetClientForTesting();
    mock.restoreAll();
  });

  it("does not throw when both emails succeed", async () => {
    const client = getResendClient()!;
    const mockSend = mock.method(
      client.emails,
      "send",
      async () => ({ data: { id: "mock-id" }, error: null })
    );

    await assert.doesNotReject(() => sendLandingLeadEmails(FAKE_LEAD));
    assert.equal(mockSend.mock.calls.length, 2);
  });

  it("does not throw when both emails fail via API error", async () => {
    const client = getResendClient()!;
    mock.method(client.emails, "send", async () => ({
      data: null,
      error: { message: "API failure", name: "api_error" },
    }));

    await assert.doesNotReject(() => sendLandingLeadEmails(FAKE_LEAD));
  });

  it("does not throw when send throws an exception", async () => {
    const client = getResendClient()!;
    mock.method(client.emails, "send", async () => {
      throw new Error("Network failure");
    });

    await assert.doesNotReject(() => sendLandingLeadEmails(FAKE_LEAD));
  });

  it("does not throw when RESEND_API_KEY is missing", async () => {
    _resetClientForTesting();
    delete process.env.RESEND_API_KEY;

    await assert.doesNotReject(() => sendLandingLeadEmails(FAKE_LEAD));
  });
});

describe("no secrets exposed client-side", () => {
  it("email modules do not contain hardcoded API key values", () => {
    const resendSource = readFileSync(
      resolve(projectRoot, "src/lib/email/resend.ts"),
      "utf-8"
    );
    const emailsSource = readFileSync(
      resolve(projectRoot, "src/lib/email/lead-emails.ts"),
      "utf-8"
    );

    assert.ok(!resendSource.includes("re_"));
    assert.ok(!emailsSource.includes("re_"));
    assert.ok(!resendSource.match(/RESEND_API_KEY\s*=/));
    assert.ok(!emailsSource.match(/RESEND_API_KEY\s*=/));
    assert.ok(!emailsSource.match(/LEAD_NOTIFICATION_EMAIL\s*=/));
  });

  it("ThankYouPage does not import email modules", () => {
    const source = readFileSync(
      resolve(
        projectRoot,
        "src/views/build-your-dream/ThankYouPage.tsx"
      ),
      "utf-8"
    );

    assert.ok(!source.includes("resend"));
    assert.ok(!source.includes("RESEND_API_KEY"));
    assert.ok(!source.includes("LEAD_NOTIFICATION_EMAIL"));
  });
});

describe("thank-you page download button", () => {
  it("ThankYouPage contains download link to /guides/5.pdf", () => {
    const source = readFileSync(
      resolve(
        projectRoot,
        "src/views/build-your-dream/ThankYouPage.tsx"
      ),
      "utf-8"
    );

    assert.ok(source.includes('href="/guides/5.pdf"'));
    assert.ok(source.includes("הורדת המדריך"));
    assert.ok(source.includes("downloadButton"));
  });
});

import { Resend } from "resend";

let client: Resend | null = null;

export function getResendClient(): Resend | null {
  if (client) return client;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[resend] RESEND_API_KEY is not set — emails will not be sent.");
    return null;
  }

  client = new Resend(apiKey);
  return client;
}

/** Reset cached client — for tests only. */
export function _resetClientForTesting(): void {
  client = null;
}

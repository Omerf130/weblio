import { createHmac, timingSafeEqual } from "node:crypto";

export const LEAD_COMPLETION_COOKIE = "lead_completion";
const TTL_MS = 24 * 60 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.LEAD_COMPLETION_SECRET ?? process.env.MONGODB_URI;
  if (!secret) {
    throw new Error("LEAD_COMPLETION_SECRET is not configured");
  }
  return secret;
}

function signPayload(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createLeadCompletionToken(leadId: string): string {
  const exp = Date.now() + TTL_MS;
  const payload = `${leadId}.${exp}`;
  return `${payload}.${signPayload(payload)}`;
}

export function verifyLeadCompletionToken(token: string): { leadId: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [leadId, expRaw, signature] = parts;
  const exp = Number(expRaw);
  if (!leadId || !Number.isFinite(exp) || !signature) {
    return null;
  }

  if (Date.now() > exp) {
    return null;
  }

  const payload = `${leadId}.${expRaw}`;
  const expected = signPayload(payload);

  try {
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return { leadId };
}

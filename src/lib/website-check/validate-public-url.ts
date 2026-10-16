import { isPrivateOrReservedIpHost } from "./private-ip";

export type PublicWebsiteUrlRejectReason =
  | "empty"
  | "too_long"
  | "invalid_url"
  | "unsupported_protocol"
  | "credentials"
  | "disallowed_port"
  | "disallowed_host"
  | "private_ip"
  | "internal_host";

export type PublicWebsiteUrlValidationResult =
  | { ok: true; normalized: string; hostname: string }
  | { ok: false; reason: PublicWebsiteUrlRejectReason; message: string };

export const PUBLIC_WEBSITE_URL_MAX_LENGTH = 2048;

const EMPTY_MESSAGE = "יש להזין כתובת אתר.";
const INVALID_MESSAGE = "כתובת האתר אינה תקינה.";
const UNSUPPORTED_PROTOCOL_MESSAGE = "ניתן לבדוק רק כתובות http או https.";
const CREDENTIALS_MESSAGE = "כתובת האתר לא יכולה לכלול שם משתמש או סיסמה.";
const DISALLOWED_PORT_MESSAGE = "ניתן לבדוק רק פורטים 80 או 443.";
const DISALLOWED_HOST_MESSAGE = "כתובת האתר אינה זמינה לבדיקה ציבורית.";
const PRIVATE_IP_MESSAGE = "לא ניתן לבדוק כתובות IP פרטיות או שמורות.";
const INTERNAL_HOST_MESSAGE = "לא ניתן לבדוק כתובות פנימיות או מקומיות.";
const TOO_LONG_MESSAGE = "כתובת האתר ארוכה מדי.";

const BLOCKED_HOST_SUFFIXES = [".localhost", ".local", ".internal", ".home", ".lan", ".corp"] as const;

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.goog",
  "kubernetes.default",
  "kubernetes.default.svc",
]);

function trimInput(raw: string): string {
  return raw.trim();
}

function normalizeHostInput(raw: string): string {
  const trimmed = trimInput(raw);
  if (!trimmed) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function reject(
  reason: PublicWebsiteUrlRejectReason,
  message: string
): PublicWebsiteUrlValidationResult {
  return { ok: false, reason, message };
}

function getEffectivePort(parsed: URL): number {
  if (parsed.port) {
    return Number.parseInt(parsed.port, 10);
  }
  return parsed.protocol === "https:" ? 443 : 80;
}

function isAllowedPort(parsed: URL): boolean {
  const port = getEffectivePort(parsed);
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    return false;
  }
  if (parsed.protocol === "http:") {
    return port === 80;
  }
  if (parsed.protocol === "https:") {
    return port === 443;
  }
  return false;
}

function hostnameLooksInternal(hostname: string): boolean {
  const lower = hostname.toLowerCase().replace(/\.$/, "");

  if (BLOCKED_HOSTNAMES.has(lower)) {
    return true;
  }

  for (const suffix of BLOCKED_HOST_SUFFIXES) {
    if (lower === suffix.slice(1) || lower.endsWith(suffix)) {
      return true;
    }
  }

  if (lower.endsWith(".localhost")) {
    return true;
  }

  return false;
}

function isPublicHostnameShape(hostname: string): boolean {
  const lower = hostname.toLowerCase();

  if (isPrivateOrReservedIpHost(lower)) {
    return false;
  }

  const ipVersion = lower.includes(":") ? 6 : lower.includes(".") ? 4 : 0;
  if (ipVersion === 4 || ipVersion === 6) {
    return true;
  }

  if (!lower.includes(".")) {
    return false;
  }

  if (lower.startsWith(".") || lower.endsWith(".")) {
    return false;
  }

  return true;
}

/**
 * Strict validation for server-side / public analysis requests.
 * Does not perform DNS resolution (see future runner hardening).
 */
export function validatePublicWebsiteUrl(raw: string): PublicWebsiteUrlValidationResult {
  const trimmed = trimInput(raw);
  if (!trimmed) {
    return reject("empty", EMPTY_MESSAGE);
  }

  if (trimmed.length > PUBLIC_WEBSITE_URL_MAX_LENGTH) {
    return reject("too_long", TOO_LONG_MESSAGE);
  }

  const candidate = normalizeHostInput(trimmed);
  if (candidate.length > PUBLIC_WEBSITE_URL_MAX_LENGTH) {
    return reject("too_long", TOO_LONG_MESSAGE);
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return reject("invalid_url", INVALID_MESSAGE);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return reject("unsupported_protocol", UNSUPPORTED_PROTOCOL_MESSAGE);
  }

  if (parsed.username || parsed.password) {
    return reject("credentials", CREDENTIALS_MESSAGE);
  }

  const hostname = parsed.hostname;
  if (!hostname) {
    return reject("invalid_url", INVALID_MESSAGE);
  }

  if (hostnameLooksInternal(hostname)) {
    return reject("internal_host", INTERNAL_HOST_MESSAGE);
  }

  if (isPrivateOrReservedIpHost(hostname)) {
    return reject("private_ip", PRIVATE_IP_MESSAGE);
  }

  if (!isPublicHostnameShape(hostname)) {
    return reject("disallowed_host", DISALLOWED_HOST_MESSAGE);
  }

  if (!isAllowedPort(parsed)) {
    return reject("disallowed_port", DISALLOWED_PORT_MESSAGE);
  }

  return {
    ok: true,
    normalized: parsed.href,
    hostname: hostname.toLowerCase(),
  };
}

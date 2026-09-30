export type UrlQuality = "strong" | "neutral" | "weak";

const WEAK_PATH_PATTERNS = [
  /\/checkout\b/i,
  /\/cart\b/i,
  /\/basket\b/i,
  /\/login\b/i,
  /\/signin\b/i,
  /\/signup\b/i,
  /\/account\b/i,
  /\/app\b/i,
  /\/apps\b/i,
  /\/download\b/i,
  /\/reel\//i,
  /\/explore\/locations\//i,
];

const BOOKING_PATH_PATTERNS = [
  /\/book\b/i,
  /\/booking\b/i,
  /\/appointments?\b/i,
  /\/schedule\b/i,
  /\/p\/[A-Za-z0-9]+/i,
  /\/b\/[A-Za-z0-9]+/i,
];

export function assessUrlQuality(url: string | undefined): UrlQuality {
  if (!url?.trim()) {
    return "weak";
  }

  let pathname = "";
  try {
    pathname = new URL(url).pathname.toLowerCase();
  } catch {
    return "weak";
  }

  if (WEAK_PATH_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return "weak";
  }

  if (BOOKING_PATH_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return "weak";
  }

  if (pathname === "/" || pathname.length <= 1) {
    return "strong";
  }

  return "neutral";
}

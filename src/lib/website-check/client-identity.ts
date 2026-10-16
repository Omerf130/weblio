import { createHash } from "node:crypto";

const CLIENT_KEY_SALT = "weblio-website-check-v1";

export function hashWebsiteCheckClientKey(raw: string): string {
  return createHash("sha256").update(`${CLIENT_KEY_SALT}:${raw}`, "utf8").digest("hex");
}

/**
 * Derives a rate-limit key from the request.
 * On Vercel, prefers the platform-provided forwarded IP header.
 */
export function resolveWebsiteCheckClientKey(request: Request): string {
  const isVercel = process.env.VERCEL === "1";

  if (isVercel) {
    const vercelIp = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
    if (vercelIp) {
      return hashWebsiteCheckClientKey(`ip:${vercelIp}`);
    }
    return hashWebsiteCheckClientKey("anonymous");
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp && !isVercel) {
    return hashWebsiteCheckClientKey(`ip:${realIp}`);
  }

  return hashWebsiteCheckClientKey("anonymous");
}

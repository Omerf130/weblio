import { WEBSITE_CHECK_MAX_REQUEST_BODY_BYTES } from "@/lib/website-check/constants";

export type ReadWebsiteCheckJsonBodyResult =
  | { ok: true; body: unknown }
  | { ok: false; status: 400 | 413 };

export async function readWebsiteCheckJsonBody(
  request: Request,
  maxBytes: number = WEBSITE_CHECK_MAX_REQUEST_BODY_BYTES
): Promise<ReadWebsiteCheckJsonBodyResult> {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number.parseInt(contentLengthHeader, 10);
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      return { ok: false, status: 413 };
    }
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return { ok: false, status: 400 };
  }

  if (raw.length > maxBytes) {
    return { ok: false, status: 413 };
  }

  if (!raw.trim()) {
    return { ok: true, body: {} };
  }

  try {
    return { ok: true, body: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, status: 400 };
  }
}

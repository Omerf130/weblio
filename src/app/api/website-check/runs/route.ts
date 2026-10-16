import { handlePostWebsiteCheckRun } from "@/lib/website-check/api/post-website-check-run";
import { WEBSITE_CHECK_MAX_REQUEST_BODY_BYTES } from "@/lib/website-check/constants";

export const runtime = "nodejs";

/** Hobby + Fluid Compute: up to 300s including after() PSI work (PSI client timeout 125s). */
export const maxDuration = 300;

export async function POST(request: Request) {
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > WEBSITE_CHECK_MAX_REQUEST_BODY_BYTES) {
      return Response.json(
        { error: "לא ניתן להתחיל ניתוח כרגע. נסו שוב מאוחר יותר." },
        { status: 413 }
      );
    }
    body = raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return Response.json(
      { error: "לא ניתן להתחיל ניתוח כרגע. נסו שוב מאוחר יותר." },
      { status: 400 }
    );
  }

  const result = await handlePostWebsiteCheckRun({ request, body });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ run: result.run }, { status: result.status });
}

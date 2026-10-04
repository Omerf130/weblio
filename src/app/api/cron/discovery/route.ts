import { handleDiscoveryCronRequest } from "@/lib/discovery/discovery-cron-handler";

export const runtime = "nodejs";

/** V2.2 discovery ~87s observed; allow headroom (verify Pro plan supports 180s). */
export const maxDuration = 180;

export async function GET(request: Request) {
  const authorizationHeader = request.headers.get("authorization");
  const { status, body } = await handleDiscoveryCronRequest({
    authorizationHeader,
  });

  return Response.json(body, { status });
}

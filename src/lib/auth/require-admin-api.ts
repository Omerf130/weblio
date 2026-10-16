import { getAdminSession } from "@/lib/auth/require-admin";
import type { AdminSessionUser } from "@/lib/auth/session";

export type RequireAdminApiResult =
  | { ok: true; admin: AdminSessionUser }
  | { ok: false; response: Response };

export async function requireAdminForApi(): Promise<RequireAdminApiResult> {
  const admin = await getAdminSession();
  if (!admin) {
    return {
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, admin };
}

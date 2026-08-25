import { redirect } from "next/navigation";
import {
  getSessionFromCookie,
  type AdminSessionUser,
} from "@/lib/auth/session";

export async function getAdminSession(): Promise<AdminSessionUser | null> {
  return getSessionFromCookie();
}

export async function requireAdmin(): Promise<AdminSessionUser> {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}

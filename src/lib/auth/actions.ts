"use server";

import { redirect } from "next/navigation";
import { GENERIC_LOGIN_ERROR } from "@/lib/auth/constants";
import { verifyAdminCredentials } from "@/lib/auth/credentials";
import { createSession, revokeSessionByCookie } from "@/lib/auth/session";
import { safeParseLoginInput } from "@/lib/validations/auth";

export type LoginActionState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const parsed = safeParseLoginInput({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  const admin = await verifyAdminCredentials(
    parsed.data.email,
    parsed.data.password
  );

  if (!admin) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  await createSession(admin.id);
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await revokeSessionByCookie();
  redirect("/admin/login");
}

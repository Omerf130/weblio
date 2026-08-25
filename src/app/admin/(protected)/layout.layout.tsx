import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/require-admin";
import AdminShellClient from "@/components/admin/AdminShellClient";

type ProtectedAdminLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedAdminLayout({
  children,
}: ProtectedAdminLayoutProps) {
  const admin = await requireAdmin();

  return (
    <AdminShellClient admin={{ name: admin.name, email: admin.email }}>
      {children}
    </AdminShellClient>
  );
}

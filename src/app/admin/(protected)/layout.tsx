import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getUnreadLeadCount } from "@/lib/data/leads";
import AdminShellClient from "@/components/admin/AdminShellClient";

type ProtectedAdminLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedAdminLayout({
  children,
}: ProtectedAdminLayoutProps) {
  const admin = await requireAdmin();
  const unreadLeadCount = await getUnreadLeadCount();

  return (
    <AdminShellClient
      admin={{ name: admin.name, email: admin.email }}
      unreadLeadCount={unreadLeadCount}
    >
      {children}
    </AdminShellClient>
  );
}

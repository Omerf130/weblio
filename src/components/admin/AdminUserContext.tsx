"use client";

import { createContext, useContext, type ReactNode } from "react";

export type AdminUserContextValue = {
  name: string;
  email: string;
};

const AdminUserContext = createContext<AdminUserContextValue | null>(null);

type AdminUserProviderProps = {
  admin: AdminUserContextValue;
  children: ReactNode;
};

export function AdminUserProvider({ admin, children }: AdminUserProviderProps) {
  return (
    <AdminUserContext.Provider value={admin}>{children}</AdminUserContext.Provider>
  );
}

export function useAdminUser(): AdminUserContextValue {
  const admin = useContext(AdminUserContext);

  if (!admin) {
    throw new Error("useAdminUser must be used within AdminUserProvider");
  }

  return admin;
}

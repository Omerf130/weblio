"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getAdminPageTitle } from "@/lib/admin/nav-config";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import { AdminUserProvider, type AdminUserContextValue } from "./AdminUserContext";
import styles from "./AdminShellClient.module.scss";

type AdminShellClientProps = {
  admin: AdminUserContextValue;
  children: ReactNode;
};

export default function AdminShellClient({ admin, children }: AdminShellClientProps) {
  const pathname = usePathname() ?? "/admin";
  const pageTitle = getAdminPageTitle(pathname);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const closeMobileNav = useCallback(() => {
    setIsMobileNavOpen(false);
  }, []);

  const toggleMobileNav = useCallback(() => {
    setIsMobileNavOpen((open) => !open);
  }, []);

  useEffect(() => {
    closeMobileNav();
  }, [pathname, closeMobileNav]);

  useEffect(() => {
    if (!isMobileNavOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileNav();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileNavOpen, closeMobileNav]);

  return (
    <AdminUserProvider admin={admin}>
      <div
        className={`${styles.shell} ${isMobileNavOpen ? styles.bodyLocked : ""}`.trim()}
        dir="rtl"
        lang="he"
      >
        <AdminSidebar
          pathname={pathname}
          className={styles.desktopSidebar}
        />

        <div className={styles.main}>
          <AdminHeader
            admin={admin}
            pageTitle={pageTitle}
            isMenuOpen={isMobileNavOpen}
            onMenuToggle={toggleMobileNav}
          />
          <main className={styles.content}>{children}</main>
        </div>

        {isMobileNavOpen ? (
          <>
            <button
              type="button"
              className={styles.backdrop}
              aria-label="סגירת תפריט"
              onClick={closeMobileNav}
            />
            <AdminSidebar
              id="admin-mobile-nav"
              pathname={pathname}
              onNavigate={closeMobileNav}
              className={`${styles.mobileDrawer} ${styles.mobileDrawerOpen}`.trim()}
            />
          </>
        ) : null}
      </div>
    </AdminUserProvider>
  );
}

import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logoutAction } from "@/lib/auth/actions";
import styles from "./admin-shell.module.scss";

type ProtectedAdminLayoutProps = {
  children: ReactNode;
};

type NavItem = {
  label: string;
  active?: boolean;
  disabled?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "לוח בקרה", active: true },
  { label: "פניות", disabled: true },
  { label: "פרויקטים", disabled: true },
  { label: "שירותים", disabled: true },
  { label: "תוכן האתר", disabled: true },
  { label: "הגדרות", disabled: true },
];

export default async function ProtectedAdminLayout({
  children,
}: ProtectedAdminLayoutProps) {
  const admin = await requireAdmin();

  return (
    <div className={styles.shell} dir="rtl" lang="he">
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden />
          <span className={styles.brandText}>
            <em>web</em>lio
          </span>
        </div>

        <nav className={styles.nav} aria-label="ניווט פאנל ניהול">
          {NAV_ITEMS.map((item) =>
            item.active ? (
              <span key={item.label} className={styles.navItemActive}>
                {item.label}
              </span>
            ) : (
              <span
                key={item.label}
                className={styles.navItemDisabled}
                aria-disabled="true"
              >
                {item.label}
              </span>
            )
          )}
        </nav>

        <div className={styles.footer}>
          <form action={logoutAction} className={styles.logoutForm}>
            <button type="submit" className={styles.logoutButton}>
              התנתקות
            </button>
          </form>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topBar}>{admin.email}</header>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}

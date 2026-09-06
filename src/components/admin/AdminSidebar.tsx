import { MdOpenInNew } from "react-icons/md";
import { logoutAction } from "@/lib/auth/actions";
import {
  ADMIN_NAV_ITEMS,
  isAdminNavItemActive,
  type AdminNavItemConfig,
} from "@/lib/admin/nav-config";
import AdminNavItem from "./AdminNavItem";
import styles from "./AdminSidebar.module.scss";

type AdminSidebarProps = {
  pathname: string;
  unreadLeadCount?: number;
  onNavigate?: () => void;
  className?: string;
  id?: string;
};

export default function AdminSidebar({
  pathname,
  unreadLeadCount = 0,
  onNavigate,
  className,
  id,
}: AdminSidebarProps) {
  return (
    <aside id={id} className={`${styles.sidebar} ${className ?? ""}`.trim()}>
      <div className={styles.sidebarBackdrop} aria-hidden>
        <div className={styles.sidebarAtmosphere} />
        <div className={styles.sidebarGrid} />
        <div className={styles.sidebarGlow} />
      </div>

      <div className={styles.sidebarContent}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden />
          <span className={styles.brandText}>
            <em>web</em>lio
          </span>
        </div>

        <nav className={styles.nav} aria-label="ניווט פאנל ניהול">
          {ADMIN_NAV_ITEMS.map((item: AdminNavItemConfig) => (
            <AdminNavItem
              key={item.id}
              item={
                item.id === "leads"
                  ? { ...item, badgeCount: unreadLeadCount }
                  : item
              }
              isActive={isAdminNavItemActive(pathname, item)}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        <div className={styles.footer}>
          <p className={styles.tagline}>
            Better websites.
            <span>A brighter tomorrow.</span>
          </p>

          <div className={styles.footerActions}>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
              onClick={onNavigate}
            >
              <MdOpenInNew aria-hidden />
              <span>מעבר לאתר</span>
            </a>

            <form action={logoutAction} className={styles.logoutForm} suppressHydrationWarning>
              <button type="submit" className={styles.logoutButton} suppressHydrationWarning>
                התנתקות
              </button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  );
}

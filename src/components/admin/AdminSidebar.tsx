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
    </aside>
  );
}

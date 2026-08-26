import type { AdminNavItemConfig } from "@/lib/admin/nav-config";
import styles from "./AdminNavItem.module.scss";

type AdminNavItemProps = {
  item: AdminNavItemConfig;
  isActive: boolean;
  onNavigate?: () => void;
};

export default function AdminNavItem({
  item,
  isActive,
  onNavigate,
}: AdminNavItemProps) {
  const Icon = item.icon;

  if (item.disabled || !item.href) {
    return (
      <span className={styles.itemDisabled} aria-disabled="true" tabIndex={-1}>
        <Icon className={styles.icon} aria-hidden />
        <span className={styles.labelWrap}>
          <span>{item.label}</span>
          {item.comingSoon ? <span className={styles.badge}>בקרוב</span> : null}
        </span>
      </span>
    );
  }

  return (
    <a
      href={item.href}
      className={isActive ? styles.itemActive : styles.item}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
    >
      <Icon className={styles.icon} aria-hidden />
      <span className={styles.labelWrap}>
        <span>{item.label}</span>
        {item.badgeCount && item.badgeCount > 0 ? (
          <span className={styles.countBadge}>{item.badgeCount}</span>
        ) : null}
      </span>
    </a>
  );
}

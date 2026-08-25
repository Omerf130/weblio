"use client";

import { GiHamburgerMenu } from "react-icons/gi";
import { logoutAction } from "@/lib/auth/actions";
import { getAdminInitials } from "@/lib/admin/get-admin-initials";
import type { AdminUserContextValue } from "./AdminUserContext";
import styles from "./AdminHeader.module.scss";

type AdminHeaderProps = {
  admin: AdminUserContextValue;
  pageTitle: string;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
};

export default function AdminHeader({
  admin,
  pageTitle,
  isMenuOpen,
  onMenuToggle,
}: AdminHeaderProps) {
  const initials = getAdminInitials(admin.name);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.menuButton}
          aria-label="פתיחת תפריט"
          aria-expanded={isMenuOpen}
          aria-controls="admin-mobile-nav"
          onClick={onMenuToggle}
        >
          <GiHamburgerMenu aria-hidden />
        </button>
        <h1 className={styles.title}>{pageTitle}</h1>
      </div>

      <div className={styles.right}>
        <div className={styles.identity}>
          <span className={styles.avatar} aria-hidden>
            {initials}
          </span>
          <div className={styles.userMeta}>
            <span className={styles.userName}>{admin.name}</span>
            <span className={styles.userEmail}>{admin.email}</span>
          </div>
        </div>

        <form action={logoutAction} className={styles.logoutForm}>
          <button type="submit" className={styles.logoutButton}>
            התנתקות
          </button>
        </form>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { MdAdd, MdOpenInNew } from "react-icons/md";
import styles from "../DashboardContent.module.scss";

type DashboardHeaderProps = {
  adminName: string;
};

export default function DashboardHeader({ adminName }: DashboardHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerCopy}>
        <h2 className={styles.headerTitle}>שלום {adminName} 👋</h2>
        <p className={styles.headerSubtitle}>הנה תמונת המצב של Weblio</p>
      </div>

      <div className={styles.headerActions}>
        <Link href="/admin/projects/new" className={styles.primaryAction}>
          <MdAdd aria-hidden />
          <span>פרויקט חדש</span>
        </Link>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.secondaryAction}
        >
          <MdOpenInNew aria-hidden />
          <span>צפייה באתר</span>
        </a>
      </div>
    </header>
  );
}

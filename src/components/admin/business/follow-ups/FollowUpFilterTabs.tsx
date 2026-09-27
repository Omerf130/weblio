"use client";

import Link from "next/link";
import styles from "./FollowUpFilterTabs.module.scss";

export type FollowUpFilter =
  | "all"
  | "today"
  | "overdue"
  | "upcoming"
  | "completed"
  | "cancelled";

type FollowUpFilterTabsProps = {
  activeFilter: FollowUpFilter;
};

const FILTERS: { id: FollowUpFilter; label: string }[] = [
  { id: "all", label: "הכל" },
  { id: "today", label: "להיום" },
  { id: "overdue", label: "באיחור" },
  { id: "upcoming", label: "קרובים" },
  { id: "completed", label: "הושלמו" },
  { id: "cancelled", label: "בוטלו" },
];

function buildHref(filter: FollowUpFilter): string {
  if (filter === "all") {
    return "/admin/business/follow-ups";
  }
  return `/admin/business/follow-ups?filter=${filter}`;
}

export default function FollowUpFilterTabs({ activeFilter }: FollowUpFilterTabsProps) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="סינון מעקבים">
      {FILTERS.map((tab) => {
        const isActive = tab.id === activeFilter;

        return (
          <Link
            key={tab.id}
            href={buildHref(tab.id)}
            className={isActive ? styles.tabActive : styles.tab}
            aria-current={isActive ? "page" : undefined}
            role="tab"
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

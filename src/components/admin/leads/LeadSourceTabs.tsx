"use client";

import Link from "next/link";
import type { LeadSourceFilter } from "@/lib/leads/rules";
import styles from "./LeadSourceTabs.module.scss";

type LeadSourceTabsProps = {
  activeSource: LeadSourceFilter;
  query?: string;
};

const TABS: { id: LeadSourceFilter; label: string }[] = [
  { id: "all", label: "הכל" },
  { id: "website", label: "אתר" },
  { id: "landingPage", label: "דף נחיתה" },
];

function buildHref(source: LeadSourceFilter, query?: string): string {
  const params = new URLSearchParams();
  if (source !== "all") {
    params.set("source", source);
  }
  if (query?.trim()) {
    params.set("q", query.trim());
  }

  const search = params.toString();
  return search ? `/admin/leads?${search}` : "/admin/leads";
}

export default function LeadSourceTabs({ activeSource, query }: LeadSourceTabsProps) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="סינון מקור פניות">
      {TABS.map((tab) => {
        const isActive = tab.id === activeSource;

        return (
          <Link
            key={tab.id}
            href={buildHref(tab.id, query)}
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

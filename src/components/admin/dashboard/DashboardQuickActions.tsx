"use client";

import Link from "next/link";
import {
  MdAdd,
  MdCampaign,
  MdInbox,
  MdOpenInNew,
} from "react-icons/md";
import styles from "../DashboardContent.module.scss";

const ACTIONS = [
  {
    label: "הוספת פרויקט",
    href: "/admin/projects/new",
    icon: MdAdd,
  },
  {
    label: "צפייה בלידים",
    href: "/admin/leads",
    icon: MdInbox,
  },
  {
    label: "עריכת דף הנחיתה",
    href: "/admin/landing-page",
    icon: MdCampaign,
  },
  {
    label: "צפייה באתר",
    href: "/",
    external: true,
    icon: MdOpenInNew,
  },
] as const;

export default function DashboardQuickActions() {
  return (
    <section className={styles.quickActionsPanel} aria-label="פעולות מהירות">
      <h3 className={styles.panelTitle}>פעולות מהירות</h3>
      <ul className={styles.quickActionsList}>
        {ACTIONS.map((action) => {
          const Icon = action.icon;

          return (
            <li key={action.label}>
              {"external" in action && action.external ? (
                <a
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.quickAction}
                >
                  <Icon aria-hidden />
                  <span>{action.label}</span>
                </a>
              ) : (
                <Link href={action.href} className={styles.quickAction}>
                  <Icon aria-hidden />
                  <span>{action.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import type { IconType } from "react-icons";
import {
  MdCampaign,
  MdDashboard,
  MdInbox,
  MdWork,
} from "react-icons/md";

export type AdminNavItemConfig = {
  id: string;
  label: string;
  href?: string;
  disabled?: boolean;
  comingSoon?: boolean;
  badgeCount?: number;
  icon: IconType;
};

export const ADMIN_NAV_ITEMS: AdminNavItemConfig[] = [
  {
    id: "dashboard",
    label: "ראשי",
    href: "/admin",
    icon: MdDashboard,
  },
  {
    id: "leads",
    label: "לידים",
    href: "/admin/leads",
    icon: MdInbox,
  },
  {
    id: "projects",
    label: "פרויקטים",
    href: "/admin/projects",
    icon: MdWork,
  },
  {
    id: "landing-page",
    label: "דף נחיתה",
    href: "/admin/landing-page",
    icon: MdCampaign,
  },
];

export function getAdminPageTitle(pathname: string): string {
  const matchedItems = ADMIN_NAV_ITEMS.filter((item) =>
    isAdminNavItemActive(pathname, item)
  );

  if (matchedItems.length === 0) {
    return "ראשי";
  }

  const bestMatch = matchedItems.reduce((longest, item) =>
    (item.href?.length ?? 0) > (longest.href?.length ?? 0) ? item : longest
  );

  return bestMatch.label;
}

export function isAdminNavItemActive(pathname: string, item: AdminNavItemConfig): boolean {
  if (!item.href) {
    return false;
  }

  if (item.href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

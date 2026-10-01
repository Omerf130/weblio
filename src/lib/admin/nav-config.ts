import type { IconType } from "react-icons";
import {
  MdCampaign,
  MdDashboard,
  MdInbox,
  MdWork,
  MdBusinessCenter,
  MdChecklist,
  MdLightbulbOutline,
  MdTravelExplore,
  MdAutoAwesome,
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

export type AdminNavGroup = {
  id: string;
  label?: string;
  items: AdminNavItemConfig[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "main",
    items: [
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
    ],
  },
  {
    id: "business",
    label: "עסקי",
    items: [
      {
        id: "business-overview",
        label: "סקירה עסקית",
        href: "/admin/business",
        icon: MdBusinessCenter,
      },
      {
        id: "follow-ups",
        label: "מעקבים",
        href: "/admin/business/follow-ups",
        icon: MdChecklist,
      },
      {
        id: "intent-monitor",
        label: "ניטור כוונות",
        href: "/admin/business/intent",
        icon: MdTravelExplore,
      },
      {
        id: "opportunities",
        label: "הזדמנויות",
        href: "/admin/business/opportunities",
        icon: MdLightbulbOutline,
      },
      {
        id: "ai-marketing",
        label: "שיווק AI",
        href: "/admin/business/ai-marketing",
        icon: MdAutoAwesome,
      },
    ],
  },
];

export const ADMIN_NAV_ITEMS: AdminNavItemConfig[] =
  ADMIN_NAV_GROUPS.flatMap((group) => group.items);

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

const EXACT_MATCH_ROUTES = new Set(["/admin", "/admin/business"]);

export function isAdminNavItemActive(pathname: string, item: AdminNavItemConfig): boolean {
  if (!item.href) {
    return false;
  }

  if (EXACT_MATCH_ROUTES.has(item.href)) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

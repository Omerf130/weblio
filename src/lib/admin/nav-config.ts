import type { IconType } from "react-icons";
import {
  MdArticle,
  MdDashboard,
  MdDesignServices,
  MdInbox,
  MdSettings,
  MdWork,
} from "react-icons/md";

export type AdminNavItemConfig = {
  id: string;
  label: string;
  href?: string;
  disabled?: boolean;
  comingSoon?: boolean;
  icon: IconType;
};

export const ADMIN_NAV_ITEMS: AdminNavItemConfig[] = [
  {
    id: "dashboard",
    label: "לוח בקרה",
    href: "/admin",
    icon: MdDashboard,
  },
  {
    id: "leads",
    label: "פניות",
    disabled: true,
    comingSoon: true,
    icon: MdInbox,
  },
  {
    id: "projects",
    label: "פרויקטים",
    disabled: true,
    comingSoon: true,
    icon: MdWork,
  },
  {
    id: "services",
    label: "שירותים",
    disabled: true,
    icon: MdDesignServices,
  },
  {
    id: "content",
    label: "תוכן האתר",
    disabled: true,
    comingSoon: true,
    icon: MdArticle,
  },
  {
    id: "settings",
    label: "הגדרות",
    disabled: true,
    icon: MdSettings,
  },
];

export function getAdminPageTitle(pathname: string): string {
  const matched = ADMIN_NAV_ITEMS.find(
    (item) => item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`))
  );

  return matched?.label ?? "לוח בקרה";
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

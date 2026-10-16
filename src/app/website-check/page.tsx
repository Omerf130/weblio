import type { Metadata } from "next";
import WebsiteCheckPage from "@/views/website-check/WebsiteCheckPage";

export const metadata: Metadata = {
  title: "בדיקת אתר בחינם | Weblio",
  description:
    "הכינו את כתובת האתר שלכם לבדיקת ביצועים, SEO, נגישות וחוויית משתמש. מנוע הניתוח המלא בדרך — גלו מה Weblio Website Analyzer יציע.",
  openGraph: {
    title: "בדיקת אתר בחינם | Weblio Website Analyzer",
    description:
      "עמוד הכנה לבדיקת אתר חינמית — ביצועים, SEO, נגישות ו-UX. הניתוח האוטומטי המלא יושק בקרוב.",
    type: "website",
  },
};

export default function WebsiteCheckRoute() {
  return <WebsiteCheckPage />;
}

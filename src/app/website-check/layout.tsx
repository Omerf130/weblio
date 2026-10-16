import { Assistant } from "next/font/google";
import type { ReactNode } from "react";

const websiteCheckAssistant = Assistant({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

type WebsiteCheckLayoutProps = {
  children: ReactNode;
};

export default function WebsiteCheckLayout({ children }: WebsiteCheckLayoutProps) {
  return <div className={`website-check-route ${websiteCheckAssistant.className}`}>{children}</div>;
}

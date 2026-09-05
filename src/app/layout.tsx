import type { ReactNode } from "react";
import Script from "next/script";
import AnalyticsProviders from "@/components/analytics/AnalyticsProviders";
import "./globals.scss";

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="he">
      <body>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1461912765743949&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {children}
        <AnalyticsProviders />
        <Script
          src="https://cdn.userway.org/widget.js"
          data-account="01EbVy4AXE"
          data-position="5"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

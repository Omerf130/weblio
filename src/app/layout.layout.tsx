import type { ReactNode } from "react";
import "./globals.scss";

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="he">
      <body>{children}</body>
    </html>
  );
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Vite route components in src/pages/ out of the Next Pages Router.
  pageExtensions: ["page.tsx", "page.ts", "layout.tsx", "layout.ts"],
};

export default nextConfig;

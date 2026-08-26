import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Keep Vite route components in src/pages/ out of the Next Pages Router.
  // Include "ts" (not "tsx") so App Router Route Handlers use standard route.ts
  // naming required by Vercel server-file tracing.
  pageExtensions: ["page.tsx", "page.ts", "layout.tsx", "layout.ts", "ts"],
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      [path.join(__dirname, "src/components/hero/Hero3DSceneLoader")]: path.join(
        __dirname,
        "src/components/hero/Hero3DSceneLoader.next.tsx"
      ),
    };
    return config;
  },
};

export default nextConfig;

import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Keep Vite route components in src/pages/ out of the Next Pages Router.
  pageExtensions: ["page.tsx", "page.ts", "layout.tsx", "layout.ts"],
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

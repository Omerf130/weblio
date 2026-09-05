import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
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

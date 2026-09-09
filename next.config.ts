import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  outputFileTracingIncludes: {
    "/build-your-dream": ["./public/guides/5.pdf"],
  },
};

export default nextConfig;

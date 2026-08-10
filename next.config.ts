import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/api/premium/personality-portrait/[type]": ["./assets/personality-premium/**/*"],
  },
};

export default nextConfig;

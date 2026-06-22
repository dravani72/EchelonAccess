import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  outputFileTracingRoot: __dirname,
  basePath: "/app"
};

export default nextConfig;

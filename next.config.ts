import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH;

const nextConfig: NextConfig = {
  reactStrictMode: false,
  outputFileTracingRoot: __dirname,
  ...(basePath ? { basePath } : {})
};

export default nextConfig;

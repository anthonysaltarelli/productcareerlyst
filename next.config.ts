import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mark packages as external to prevent bundling issues
  serverExternalPackages: ['@sparticuz/chromium-min', 'puppeteer-core'],
};

export default nextConfig;

import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const nextConfig: NextConfig = {
  // Mark packages as external to prevent bundling issues
  serverExternalPackages: ['@sparticuz/chromium-min', 'puppeteer-core'],
};

export default withBotId(nextConfig);

import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

// Allow dev server connections from tunnel URLs (ngrok, cloudflared, etc.)
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const tunnelledDevOrigins =
  appUrl && !appUrl.includes("localhost")
    ? [new URL(appUrl).hostname]
    : undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Allow HMR WebSocket connections when accessed through a tunnel
  allowedDevOrigins: tunnelledDevOrigins,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "",
  project: process.env.SENTRY_PROJECT || "",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});

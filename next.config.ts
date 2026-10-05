import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Static pages with no user input or third-party scripts. Next's inline bootstrap scripts need
// 'unsafe-inline' without nonces, and nonces would force every page to render per request.
// /ask takes API keys, so it is excluded here and gets a nonce policy from proxy.ts instead.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      {
        // Every page except /ask, which gets a stricter per-request nonce policy from proxy.ts.
        source: "/:path((?!ask$).*)",
        headers: [{ key: "Content-Security-Policy", value: csp }],
      },
    ];
  },
};

export default nextConfig;

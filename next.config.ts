import type { NextConfig } from "next";

// connect-src enforces the core privacy promise at the browser level: the page
// cannot send network requests anywhere except its own origin, so uploaded
// Excel data physically cannot leave the client. The only exceptions are the
// optional feedback collectors — added ONLY when their env var is set, and
// they receive merchant/classification metadata, never file contents.
// Also allow Vercel Analytics to send analytics data.
const connectExtras: string[] = ["https://vitals.vercel-analytics.com"];
if (process.env.NEXT_PUBLIC_APPS_SCRIPT_URL) {
  // Apps Script web apps redirect from script.google.com to googleusercontent.
  connectExtras.push(
    "https://script.google.com",
    "https://script.googleusercontent.com"
  );
}

// React's dev build uses eval() for debugging features; production never does.
// Allow it only in development so the production CSP stays locked down.
// Also allow Vercel Analytics script to load from cdn.vercel-insights.com
const scriptSrc =
  process.env.NODE_ENV === "development"
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.vercel-insights.com"
    : "script-src 'self' 'unsafe-inline' https://cdn.vercel-insights.com";

const csp = [
  "default-src 'self'",
  // Next.js requires inline scripts for hydration bootstrapping
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self'${connectExtras.length ? ` ${connectExtras.join(" ")}` : ""}`,
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;

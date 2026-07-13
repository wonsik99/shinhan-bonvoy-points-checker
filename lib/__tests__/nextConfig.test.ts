import { afterEach, describe, expect, it, vi } from "vitest";

interface HeaderEntry {
  key: string;
  value: string;
}

async function loadResponseHeaders(
  nodeEnv: string,
  collectorUrl = ""
): Promise<HeaderEntry[]> {
  vi.stubEnv("NODE_ENV", nodeEnv);
  vi.stubEnv("NEXT_PUBLIC_APPS_SCRIPT_URL", collectorUrl);
  vi.resetModules();
  const { default: config } = await import("../../next.config");
  const rules = await config.headers?.();
  return (rules?.[0]?.headers ?? []) as HeaderEntry[];
}

function headerValue(headers: HeaderEntry[], key: string): string {
  const value = headers.find((header) => header.key === key)?.value;
  expect(value, `${key} header`).toBeDefined();
  return value ?? "";
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("security headers", () => {
  it("locks production connections to the same origin by default", async () => {
    const headers = await loadResponseHeaders("production");
    const csp = headerValue(headers, "Content-Security-Policy");

    expect(csp).toContain("connect-src 'self'");
    // Vercel Analytics domain is always allowed
    expect(csp).toContain("https://vitals.vercel-analytics.com");
    expect(csp).not.toContain("script.google.com");
    expect(csp).not.toContain("googleusercontent.com");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(headerValue(headers, "X-Content-Type-Options")).toBe("nosniff");
    expect(headerValue(headers, "Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin"
    );
  });

  it("allows only the fixed Apps Script origins when collection is enabled", async () => {
    const headers = await loadResponseHeaders(
      "production",
      "https://evil.example/collector"
    );
    const csp = headerValue(headers, "Content-Security-Policy");

    // Vercel Analytics domain is always present
    expect(csp).toContain("https://vitals.vercel-analytics.com");
    // Apps Script domains are added when collection is enabled
    expect(csp).toContain("https://script.google.com");
    expect(csp).toContain("https://script.googleusercontent.com");
    expect(csp).not.toContain("evil.example");
  });

  it("allows eval only in the development script policy", async () => {
    const headers = await loadResponseHeaders("development");
    const csp = headerValue(headers, "Content-Security-Policy");
    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    // Vercel Analytics script domain is also allowed
    expect(csp).toContain("https://cdn.vercel-insights.com");
  });
});

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { blockCrossSiteDEV } from "next/dist/server/lib/router-utils/block-cross-site-dev";
import { approvedFrameworkDependencyChanges } from "./helpers/frameworkDependencyApproval";

// Exercise the installed framework's guard, not a duplicate implementation.
// The framework is pinned; review this boundary again when upgrading it.
function checkOrigin(url: string, headers: IncomingMessage["headers"]) {
  const response = { statusCode: 200, end: vi.fn() };
  const blocked = blockCrossSiteDEV(
    { url, headers } as IncomingMessage,
    response as unknown as ServerResponse,
    undefined,
    "127.0.0.1"
  );
  return { blocked, response };
}

const protectedMcpUrls = [
  "/_next/mcp",
  "/_next/mcp?probe=/_next/image",
  "/_next/mcp?probe=/_next/static/media",
  "/_next/mcp?probe=%2F_next%2Fimage",
];

it("limits the approved manifest change to Next.js and its ESLint configuration", () => {
  const manifest = JSON.parse(readFileSync("package.json", "utf8"));
  expect(manifest.dependencies.next).toBe("16.3.8");
  expect(manifest.devDependencies["eslint-config-next"]).toBe("16.3.8");
  manifest.dependencies.next = "16.2.10";
  manifest.devDependencies["eslint-config-next"] = "16.2.10";
  expect(createHash("sha256").update(JSON.stringify(manifest, null, 2) + "\n").digest("hex"))
    .toBe(approvedFrameworkDependencyChanges[0].beforeSha256);
});

describe("framework development origin boundary", () => {
  for (const origin of ["https://untrusted.example", "null"]) {
    it.each(protectedMcpUrls)("rejects " + origin + " for %s", (url) => {
      const { blocked, response } = checkOrigin(url, { origin });
      expect(blocked).toBe(true);
      expect(response.statusCode).toBe(403);
      expect(response.end).toHaveBeenCalledWith("Unauthorized");
    });
  }

  it.each(protectedMcpUrls)("rejects cross-site no-cors Referer for %s", (url) => {
    const { blocked, response } = checkOrigin(url, {
      "sec-fetch-mode": "no-cors",
      "sec-fetch-site": "cross-site",
      referer: "https://untrusted.example/",
    });
    expect(blocked).toBe(true);
    expect(response.statusCode).toBe(403);
    expect(response.end).toHaveBeenCalledWith("Unauthorized");
  });

  for (const origin of ["http://localhost:3100", "http://127.0.0.1:3100"]) {
    it.each(protectedMcpUrls)("preserves " + origin + " for %s", (url) => {
      const { blocked, response } = checkOrigin(url, { origin });
      expect(blocked).toBe(false);
      expect(response.end).not.toHaveBeenCalled();
    });
  }

  it("preserves local non-browser clients without an Origin header", () => {
    const { blocked, response } = checkOrigin("/_next/mcp", {});
    expect(blocked).toBe(false);
    expect(response.end).not.toHaveBeenCalled();
  });

  it.each(["/_next/image?url=/favicon.ico", "/_next/static/media/font.woff2"])(
    "preserves the public image/media exception for %s",
    (url) => {
      const { blocked, response } = checkOrigin(url, {
        origin: "https://untrusted.example",
      });
      expect(blocked).toBe(false);
      expect(response.end).not.toHaveBeenCalled();
    }
  );
});

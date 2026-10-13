import { expect, test, type APIRequestContext } from "@playwright/test";

// Initialize only: never request project metadata, logs, source or user files.
function initializeMcp(
  request: APIRequestContext,
  path: string,
  headers: Record<string, string> = {}
) {
  return request.post(path, {
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
      ...headers,
    },
    data: {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "local-boundary-regression", version: "1" },
      },
    },
  });
}

test("keeps local MCP initialization working", async ({ request }) => {
  const response = await initializeMcp(request, "/_next/mcp", {
    Origin: "http://127.0.0.1:3100",
  });
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('"protocolVersion"');
});

test("rejects foreign and opaque origins despite query exceptions", async ({ request }) => {
  for (const origin of ["https://untrusted.example", "null"]) {
    for (const path of [
      "/_next/mcp",
      "/_next/mcp?probe=/_next/image",
      "/_next/mcp?probe=/_next/static/media",
      "/_next/mcp?probe=%2F_next%2Fimage",
    ]) {
      const response = await initializeMcp(request, path, { Origin: origin });
      expect(response.status(), origin + " " + path).toBe(403);
      expect(await response.text()).not.toContain('"protocolVersion"');
    }
  }
});

test("rejects foreign no-cors Referer despite query exceptions", async ({ request }) => {
  for (const path of [
    "/_next/mcp?probe=/_next/image",
    "/_next/mcp?probe=/_next/static/media",
  ]) {
    const response = await initializeMcp(request, path, {
      "Sec-Fetch-Mode": "no-cors",
      "Sec-Fetch-Site": "cross-site",
      Referer: "https://untrusted.example/",
    });
    expect(response.status(), path).toBe(403);
    expect(await response.text()).not.toContain('"protocolVersion"');
  }
});

test("does not route MCP prefix or image/media suffixes to its transport", async ({ request }) => {
  for (const path of [
    "/_next/mcp-unknown",
    "/_next/mcp/unknown",
    "/_next/mcp/_next/image",
    "/_next/mcp/_next/static/media",
  ]) {
    const response = await initializeMcp(request, path, {
      Origin: "http://127.0.0.1:3100",
    });
    expect([403, 404], path).toContain(response.status());
    expect(await response.text()).not.toContain('"protocolVersion"');
  }
});

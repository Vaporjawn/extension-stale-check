import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { expect } from "@playwright/test";
import { createExtensionTest } from "../src/playwright/index.js";
import { copyFixture } from "../tests/helpers/copyFixture.js";
import { editManifest } from "../tests/helpers/editManifest.js";

const dist = await copyFixture();
const test = createExtensionTest({ dist, onStale: "restart" });
let server: Server;
let url: string;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  server = createServer((_request, response) => response.end("<html><body>hello</body></html>"));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  url = `http://127.0.0.1:${String((server.address() as AddressInfo).port)}/`;
});

test.afterAll(() => {
  server.close();
});

test("loads the extension, so its content script runs, and reports it fresh", async ({
  page,
  extensionId,
  freshness,
}) => {
  await page.goto(url);
  await expect(page.locator("html")).toHaveAttribute("data-stale-check", "ran");
  expect(extensionId).toMatch(/^[a-p]{32}$/);
  expect(freshness.restarted).toBe(false);
  expect(freshness.report.loadedVersion).toBe("1.0.0");

  // A rebuild lands while the browser is still open.
  await editManifest(dist, (manifest) => (manifest["version"] = "1.0.1"));
});

test("restarts the browser before the next test when the manifest changed", async ({
  serviceWorker,
  freshness,
}) => {
  expect(freshness.restarted).toBe(true);
  expect(freshness.report.status).toBe("fresh");
  expect(freshness.report.loadedVersion).toBe("1.0.1");
  const version = await serviceWorker.evaluate(
    () =>
      (
        globalThis as unknown as { chrome: { runtime: { getManifest(): { version: string } } } }
      ).chrome.runtime.getManifest().version,
  );
  expect(version).toBe("1.0.1");
});

test("does not restart again once it is fresh", ({ freshness }) => {
  expect(freshness.restarted).toBe(false);
});

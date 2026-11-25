import { expect } from "@playwright/test";
import { createExtensionTest } from "../src/playwright/index.js";
import { copyFixture } from "../tests/helpers/copyFixture.js";
import { editManifest } from "../tests/helpers/editManifest.js";

const dist = await copyFixture();
const test = createExtensionTest({ dist });

test.describe.configure({ mode: "serial" });

test("starts fresh, then a rebuild changes the manifest", async ({ freshness }) => {
  expect(freshness.report.status).toBe("fresh");
  await editManifest(dist, (manifest) => (manifest["version"] = "2.0.0"));
});

// Declared with `test.fail(title, body)` so Playwright knows up front that this test must FAIL. The
// stale check throws in fixture setup, before the body runs, so an annotation inside the body would
// never be reached. If the check were missing, the body would run and the test would be reported as
// an unexpected pass.
test.fail("is stopped by the stale check instead of running against old code", async ({ page }) => {
  await page.goto("about:blank");
  expect(true).toBe(true);
});

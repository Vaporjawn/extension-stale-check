import { test as base, type Worker } from "@playwright/test";
import { assertExtensionFresh } from "../runtime/assertExtensionFresh.js";
import { checkRuntimeFreshness } from "../runtime/checkRuntimeFreshness.js";
import type { RuntimeReport } from "../types.js";
import { launchExtension, type LaunchedExtension, type LaunchOptions } from "./launchExtension.js";

/** Options for {@link createExtensionTest}. */
export interface ExtensionTestOptions extends LaunchOptions {
  /**
   * What to do when `dist/` changed since the extension loaded. `fail` (the default) stops the test
   * with a {@link StaleExtensionError}; `restart` restarts the browser on the same profile so the
   * extension loads the new build, then carries on.
   */
  readonly onStale?: "fail" | "restart";
  /** Manifest paths to ignore when comparing, e.g. `["key"]`. */
  readonly ignorePaths?: readonly string[];
}

/** What the `freshness` fixture holds. */
export interface FreshnessResult {
  /** The comparison made just before the test started (after the restart, if there was one). */
  readonly report: RuntimeReport;
  /** `true` when the extension was stale and the browser was restarted for this test. */
  readonly restarted: boolean;
}

/**
 * Builds a Playwright `test` whose browser already has your extension loaded, and which checks the
 * extension is not stale before every test.
 *
 * One browser is shared by all tests in a worker. Before each test the loaded manifest is compared
 * with `dist/manifest.json`; if a rebuild changed it, the test fails (or the browser restarts, with
 * `onStale: "restart"`) instead of quietly exercising old code.
 *
 * Fixtures: `context` and `page` (from Playwright), plus `extensionId`, `serviceWorker` and
 * `freshness`. `freshness` runs before every test and before `context` is handed out.
 *
 * @param options - The extension folder, launch settings, and the stale policy.
 * @returns A Playwright `test` function to use in place of the one from `@playwright/test`.
 */
export const createExtensionTest = (options: ExtensionTestOptions) =>
  base.extend<
    { extensionId: string; serviceWorker: Worker; freshness: FreshnessResult },
    { launched: LaunchedExtension }
  >({
    launched: [
      // Playwright reads a fixture's dependencies from the destructured argument, so it stays empty.
      async ({}, use) => {
        const launched = await launchExtension(options);
        await use(launched);
        await launched.close();
      },
      { scope: "worker" },
    ],

    freshness: [
      async ({ launched }, use) => {
        const ignore = options.ignorePaths ? { ignorePaths: options.ignorePaths } : {};
        let restarted = false;
        const first = await checkRuntimeFreshness({
          target: launched.worker,
          dist: launched.dist,
          ...ignore,
        });
        if (first.status === "stale" && options.onStale === "restart") {
          await launched.restart();
          restarted = true;
        }
        const report = await assertExtensionFresh({
          target: launched.worker,
          dist: launched.dist,
          ...ignore,
        });
        await use({ report, restarted });
      },
      { auto: true },
    ],

    // Depends on `freshness` so a restart has finished before the test is given a context.
    context: async ({ launched, freshness: _freshness }, use) => {
      await use(launched.context);
    },

    extensionId: async ({ launched, freshness: _freshness }, use) => {
      await use(launched.extensionId);
    },

    serviceWorker: async ({ launched, freshness: _freshness }, use) => {
      await use(launched.worker);
    },
  });

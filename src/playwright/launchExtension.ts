import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { BrowserContext, Worker } from "playwright-core";
import { readDiskManifest } from "../manifest/readDiskManifest.js";
import { startBrowser } from "./startBrowser.js";

/** Options for {@link launchExtension}. */
export interface LaunchOptions {
  /** The built extension folder (the one holding `manifest.json`). */
  readonly dist: string;
  /** Browser profile folder. Defaults to a fresh temporary folder that `close()` removes. */
  readonly userDataDir?: string;
  /** Run without a window. Defaults to `true`; extensions load in Chromium's new headless mode. */
  readonly headless?: boolean;
  /** Playwright browser channel. Defaults to `chromium`, the full build that can load extensions. */
  readonly channel?: string;
  /** Path to a Chromium or Chrome for Testing binary. Defaults to the `CHROME_PATH` variable, if set. */
  readonly executablePath?: string;
  /** Extra command-line flags for the browser. */
  readonly args?: readonly string[];
  /** How long to wait for the extension's service worker, in milliseconds. Defaults to 15000. */
  readonly timeout?: number;
}

/** A browser running the extension. `context`, `worker` and `extensionId` change on `restart()`. */
export interface LaunchedExtension {
  /** The persistent browser context the extension is loaded in. */
  context: BrowserContext;
  /** The extension's service worker. */
  worker: Worker;
  /** The extension's id, read from the service worker's URL. */
  extensionId: string;
  /** The profile folder in use. */
  readonly userDataDir: string;
  /** The folder the extension was loaded from. */
  readonly dist: string;
  /**
   * Closes the browser and starts it again on the same profile, so the extension loads from
   * `dist/` as it is now. Storage persists, as it would across a reload. Pages are closed.
   */
  restart(): Promise<void>;
  /** Closes the browser and removes the temporary profile, if there is one. */
  close(): Promise<void>;
}

/**
 * Starts Chromium with an unpacked extension loaded and waits for its service worker.
 *
 * Needs `playwright-core` (or `@playwright/test`) and a Chromium build installed with
 * `npx playwright install chromium`. The headless shell cannot load extensions, which is why the
 * default channel is `chromium`.
 *
 * @param options - The extension folder and optional browser settings.
 * @returns The context, the service worker, the extension id, `restart()` and `close()`.
 * @throws When the folder has no manifest, or the extension has no service worker to find.
 */
export const launchExtension = async (options: LaunchOptions): Promise<LaunchedExtension> => {
  const dist = path.resolve(options.dist);
  await readDiskManifest(dist);

  const ownsProfile = options.userDataDir === undefined;
  const userDataDir =
    options.userDataDir ?? (await mkdtemp(path.join(os.tmpdir(), "extension-stale-check-")));
  /** Removes the profile folder, but only when this call created it. */
  const removeProfile = async (): Promise<void> => {
    if (ownsProfile) await rm(userDataDir, { recursive: true, force: true });
  };

  let started;
  try {
    started = await startBrowser(options, dist, userDataDir);
  } catch (error) {
    await removeProfile();
    throw error;
  }

  const launched: LaunchedExtension = {
    ...started,
    userDataDir,
    dist,
    restart: async () => {
      await launched.context.close();
      Object.assign(launched, await startBrowser(options, dist, userDataDir));
    },
    close: async () => {
      await launched.context.close();
      await removeProfile();
    },
  };
  return launched;
};

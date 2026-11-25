import type { BrowserContext, Worker } from "playwright-core";
import type { LaunchOptions } from "./launchExtension.js";

/** A running browser with the extension loaded. */
export interface StartedBrowser {
  /** The persistent browser context. */
  readonly context: BrowserContext;
  /** The extension's service worker. */
  readonly worker: Worker;
  /** The extension's id, read from the service worker's URL. */
  readonly extensionId: string;
}

/**
 * Starts Chromium on a profile folder with an unpacked extension loaded, and waits for the
 * extension's service worker.
 *
 * @param options - The launch options given to `launchExtension`.
 * @param dist - The absolute extension folder.
 * @param userDataDir - The profile folder to use.
 * @returns The context, worker and extension id.
 * @throws When the extension never starts a service worker (the browser is closed first).
 */
export const startBrowser = async (
  options: LaunchOptions,
  dist: string,
  userDataDir: string,
): Promise<StartedBrowser> => {
  const { chromium } = await import("playwright-core");
  const executablePath = options.executablePath ?? process.env["CHROME_PATH"];
  const timeout = options.timeout ?? 15_000;

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: options.headless ?? true,
    ...(executablePath ? { executablePath } : { channel: options.channel ?? "chromium" }),
    args: [
      `--disable-extensions-except=${dist}`,
      `--load-extension=${dist}`,
      ...(options.args ?? []),
    ],
  });

  try {
    /** Whether a service worker belongs to an extension rather than to a web page. */
    const isExtensionWorker = (worker: Worker): boolean =>
      worker.url().startsWith("chrome-extension://");
    const worker =
      context.serviceWorkers().find(isExtensionWorker) ??
      (await context.waitForEvent("serviceworker", { predicate: isExtensionWorker, timeout }));
    return { context, worker, extensionId: new URL(worker.url()).host };
  } catch (cause) {
    await context.close();
    throw new Error(
      "The extension never started a service worker. Manifest V3 needs a `background.service_worker`; " +
        "for an extension without one, load it yourself and pass an extension page to checkRuntimeFreshness.",
      { cause },
    );
  }
};

import { isPlainObject } from "../manifest/isPlainObject.js";
import type { Evaluable, JsonObject } from "../types.js";

/**
 * Asks a running extension for the manifest the browser loaded, via `chrome.runtime.getManifest()`.
 *
 * Chrome parses `manifest.json` once, when the extension loads, and keeps that copy for as long as
 * the extension runs. Editing the file afterwards does not change it, which is exactly why this
 * can be compared with the file on disk.
 *
 * @param target - The extension's service worker, or a page open on a `chrome-extension://` URL.
 * @returns The manifest as the browser holds it.
 * @throws When the target is not an extension context.
 */
export const readLoadedManifest = async (target: Evaluable): Promise<JsonObject> => {
  const manifest = await target.evaluate(() => {
    const api = (
      globalThis as unknown as { chrome?: { runtime?: { getManifest?: () => unknown } } }
    ).chrome?.runtime;
    return api?.getManifest?.();
  });
  if (!isPlainObject(manifest)) {
    throw new Error(
      "chrome.runtime.getManifest() is not available here. Pass the extension's service worker, " +
        "or a page open on a chrome-extension:// URL.",
    );
  }
  return manifest;
};

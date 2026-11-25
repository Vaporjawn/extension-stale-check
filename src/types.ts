/** A parsed JSON object, such as a `manifest.json`. */
export type JsonObject = Record<string, unknown>;

/**
 * Anything that can run a function inside an extension's JavaScript context: a Playwright `Worker`
 * (the MV3 service worker) or a `Page` open on a `chrome-extension://` URL. Puppeteer's equivalents
 * fit too.
 */
export interface Evaluable {
  /** Runs `pageFunction` in the extension context and resolves with its (serialisable) result. */
  evaluate(pageFunction: () => unknown): Promise<unknown>;
}

/** One place where the loaded extension and `dist/` disagree. */
export interface ManifestDifference {
  /** Where the values differ, e.g. `version`, `permissions[1]`, `content_scripts[0].matches[0]`. */
  readonly path: string;
  /** The value the browser is running, or `undefined` when it has no such key. */
  readonly loaded: unknown;
  /** The value in `dist/manifest.json`, or `undefined` when the file has no such key. */
  readonly disk: unknown;
}

/** The result of comparing a running extension with `dist/`. */
export interface RuntimeReport {
  /** `fresh` when the running manifest matches the disk manifest, otherwise `stale`. */
  readonly status: "fresh" | "stale";
  /** The `version` the browser is running. */
  readonly loadedVersion: string | undefined;
  /** The `version` in `dist/manifest.json`. */
  readonly diskVersion: string | undefined;
  /** Every difference found, in manifest order (keys sorted, array items by index). Empty when fresh. */
  readonly differences: readonly ManifestDifference[];
  /** A SHA-256 over every file in `dist/`, so a report can be matched to one build. */
  readonly diskHash: string;
  /** A one-line summary, ready to print. */
  readonly message: string;
}

/** The browsers whose profile folder this package knows how to find. */
export type BrowserName = "chrome" | "chromium" | "brave" | "edge";

/** The result of reading a real browser profile and comparing it with `dist/`. */
export interface ProfileReport {
  /**
   * `fresh`: nothing disagrees. `stale`: the profile's record of the extension differs from
   * `dist/manifest.json`. `possibly-stale`: records match, but files in `dist/` changed after the
   * extension was last loaded. `not-loaded`: the profile has no extension loaded from `dist/`.
   */
  readonly status: "fresh" | "possibly-stale" | "stale" | "not-loaded";
  /** The profile folder that was read. */
  readonly profilePath: string;
  /** The extension's id, when it was found. */
  readonly extensionId: string | undefined;
  /** When the browser last loaded or reloaded the extension, when known. */
  readonly loadedAt: Date | undefined;
  /** The `version` in `dist/manifest.json`. */
  readonly diskVersion: string | undefined;
  /** The `version` the browser registered its service worker with, when known. */
  readonly registeredVersion: string | undefined;
  /** Manifest fields the profile records that no longer match `dist/manifest.json`. */
  readonly differences: readonly ManifestDifference[];
  /** Files in `dist/` modified after `loadedAt` (at most 10, newest first). */
  readonly newerFiles: readonly string[];
  /** A one-line summary, ready to print. */
  readonly message: string;
}

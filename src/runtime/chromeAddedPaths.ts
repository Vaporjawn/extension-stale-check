/**
 * Manifest keys Chrome adds to what `chrome.runtime.getManifest()` returns, which are never in the
 * file on disk. Seen in a real browser: `current_locale` appears whenever the extension has a
 * `default_locale`. They are left out of every runtime comparison.
 */
export const CHROME_ADDED_PATHS: readonly string[] = ["current_locale"];

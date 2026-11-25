import os from "node:os";
import path from "node:path";
import type { BrowserName } from "../types.js";
import { BROWSER_FOLDERS } from "./browserFolders.js";

/** Options for {@link resolveUserDataDir}; every field defaults to the current machine. */
export interface ResolveUserDataDirOptions {
  /** Which browser to look for. Defaults to `chrome`. */
  readonly browser?: BrowserName;
  /** Node.js platform name. Defaults to `process.platform`. */
  readonly platform?: NodeJS.Platform;
  /** The home folder. Defaults to `os.homedir()`. */
  readonly home?: string;
  /** Environment variables. Defaults to `process.env`. */
  readonly env?: Readonly<Record<string, string | undefined>>;
}

/**
 * Finds a browser's "user data" folder, the one that holds `Default/`, `Profile 1/`, and so on.
 *
 * @param options - The browser, and optionally an explicit platform, home folder or environment.
 * @returns The absolute path. The folder may not exist when the browser is not installed.
 * @throws When the browser has no known location on the platform.
 */
export const resolveUserDataDir = (options: ResolveUserDataDirOptions = {}): string => {
  const browser = options.browser ?? "chrome";
  const platform = options.platform ?? process.platform;
  const folder = BROWSER_FOLDERS[browser][platform];
  if (!folder)
    throw new Error(`No known ${browser} profile folder on ${platform}. Pass userDataDir.`);

  const home = options.home ?? os.homedir();
  const env = options.env ?? process.env;
  const base =
    folder.base === "localAppData"
      ? (env["LOCALAPPDATA"] ?? path.join(home, "AppData", "Local"))
      : home;
  return path.join(base, ...folder.segments);
};

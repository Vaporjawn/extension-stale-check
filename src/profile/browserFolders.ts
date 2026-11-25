import type { BrowserName } from "../types.js";

/** A browser's profile root, per platform, relative to the folder named in `base`. */
export interface BrowserFolder {
  /** `home` for a path under the home folder, `localAppData` for Windows' `%LOCALAPPDATA%`. */
  readonly base: "home" | "localAppData";
  /** Path segments from `base` to the folder that holds `Default`, `Profile 1`, and so on. */
  readonly segments: readonly string[];
}

/** Where each supported browser keeps its profiles, per Node.js platform name. */
export const BROWSER_FOLDERS: Record<
  BrowserName,
  Partial<Record<NodeJS.Platform, BrowserFolder>>
> = {
  chrome: {
    darwin: { base: "home", segments: ["Library", "Application Support", "Google", "Chrome"] },
    linux: { base: "home", segments: [".config", "google-chrome"] },
    win32: { base: "localAppData", segments: ["Google", "Chrome", "User Data"] },
  },
  chromium: {
    darwin: { base: "home", segments: ["Library", "Application Support", "Chromium"] },
    linux: { base: "home", segments: [".config", "chromium"] },
    win32: { base: "localAppData", segments: ["Chromium", "User Data"] },
  },
  brave: {
    darwin: {
      base: "home",
      segments: ["Library", "Application Support", "BraveSoftware", "Brave-Browser"],
    },
    linux: { base: "home", segments: [".config", "BraveSoftware", "Brave-Browser"] },
    win32: { base: "localAppData", segments: ["BraveSoftware", "Brave-Browser", "User Data"] },
  },
  edge: {
    darwin: { base: "home", segments: ["Library", "Application Support", "Microsoft Edge"] },
    linux: { base: "home", segments: [".config", "microsoft-edge"] },
    win32: { base: "localAppData", segments: ["Microsoft", "Edge", "User Data"] },
  },
};

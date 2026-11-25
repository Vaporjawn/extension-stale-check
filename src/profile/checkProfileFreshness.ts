import path from "node:path";
import { readDiskManifest } from "../manifest/readDiskManifest.js";
import { readVersion } from "../manifest/readVersion.js";
import { formatProfileMessage } from "../report/formatProfileMessage.js";
import type { BrowserName, ManifestDifference, ProfileReport } from "../types.js";
import { findExtensionEntry } from "./findExtensionEntry.js";
import { findNewerFiles } from "./findNewerFiles.js";
import { permissionDifferences } from "./permissionDifferences.js";
import { readExtensionSettings } from "./readExtensionSettings.js";
import { resolveUserDataDir } from "./resolveUserDataDir.js";
import { webkitTimeToDate } from "./webkitTimeToDate.js";

/** Options for {@link checkProfileFreshness}. */
export interface ProfileCheckOptions {
  /** The folder the extension was loaded from (the one `chrome://extensions` shows under "Loaded from"). */
  readonly dist: string;
  /** Which browser's profile to read. Defaults to `chrome`. Ignored when `userDataDir` is set. */
  readonly browser?: BrowserName;
  /** The browser's user-data folder. Defaults to the browser's standard location. */
  readonly userDataDir?: string;
  /** The profile folder name inside the user-data folder. Defaults to `Default`. */
  readonly profile?: string;
  /** Ignore files modified within this many milliseconds after the load. Defaults to 0. */
  readonly toleranceMs?: number;
}

/**
 * Reads a real browser profile and judges whether the extension it loaded from `dist/` is stale.
 *
 * A profile records when the extension last loaded, the version its service worker registered with,
 * and the permissions in force. This compares each of those with `dist/`, and looks for files that
 * changed after the load. Chrome writes its preference files a few seconds after a change and when
 * it exits, so a result can trail what the browser is doing right now.
 *
 * @param options - The built folder, and which browser profile to read.
 * @returns A report whose `status` is `fresh`, `possibly-stale`, `stale` or `not-loaded`.
 */
export const checkProfileFreshness = async (
  options: ProfileCheckOptions,
): Promise<ProfileReport> => {
  const userDataDir =
    options.userDataDir ?? resolveUserDataDir(options.browser ? { browser: options.browser } : {});
  const profilePath = path.join(userDataDir, options.profile ?? "Default");
  const disk = await readDiskManifest(options.dist);
  const diskVersion = readVersion(disk);

  const settings = await readExtensionSettings(profilePath);
  const found = await findExtensionEntry(settings, options.dist);
  if (!found) {
    const base = {
      status: "not-loaded",
      profilePath,
      extensionId: undefined,
      loadedAt: undefined,
      diskVersion,
      registeredVersion: undefined,
      differences: [],
      newerFiles: [],
    } as const;
    return { ...base, message: formatProfileMessage(base) };
  }

  const registration = found.entry["service_worker_registration_info"];
  const registeredVersion =
    typeof registration === "object" &&
    registration !== null &&
    "version" in registration &&
    typeof registration.version === "string"
      ? registration.version
      : undefined;
  const versionDifference: ManifestDifference[] =
    registeredVersion !== undefined && registeredVersion !== diskVersion
      ? [{ path: "version", loaded: registeredVersion, disk: diskVersion }]
      : [];
  const differences = [...versionDifference, ...permissionDifferences(found.entry, disk)];

  const loadedAt = webkitTimeToDate(found.entry["last_update_time"]);
  const newerFiles = loadedAt
    ? await findNewerFiles(options.dist, loadedAt.getTime() + (options.toleranceMs ?? 0))
    : [];

  const status =
    differences.length > 0 ? "stale" : newerFiles.length > 0 ? "possibly-stale" : "fresh";
  const base = {
    status,
    profilePath,
    extensionId: found.id,
    loadedAt,
    diskVersion,
    registeredVersion,
    differences,
    newerFiles,
  } as const;
  return { ...base, message: formatProfileMessage(base) };
};

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/** What a fake profile should record about the extension. */
export interface FakeEntry {
  /** The folder the extension is loaded from. */
  readonly path: string;
  /** When Chrome last loaded it, as Unix milliseconds. */
  readonly loadedAtMs: number;
  /** The version the service worker registered with. */
  readonly version?: string;
  /** Permissions in force, in Chrome's `active_permissions` shape. */
  readonly active?: {
    readonly api: string[];
    readonly explicit_host: string[];
    readonly scriptable_host: string[];
  };
  /** Which file Chrome wrote the entry to. Defaults to `Secure Preferences`. */
  readonly file?: "Preferences" | "Secure Preferences";
}

/** Microseconds between Chrome's epoch (1601) and the Unix epoch (1970). */
const WEBKIT_OFFSET_MS = 11_644_473_600_000;

/**
 * Writes a fake browser user-data folder holding one extension entry, in Chrome's real file shape.
 *
 * @param userDataDir - The folder to create the profile in.
 * @param entry - What the profile records about the extension.
 * @param id - The extension id to file it under.
 * @returns The profile folder (`<userDataDir>/Default`).
 */
export const writeProfile = async (
  userDataDir: string,
  entry: FakeEntry,
  id = "abcdefghijklmnopabcdefghijklmnop",
): Promise<string> => {
  const profile = path.join(userDataDir, "Default");
  await mkdir(profile, { recursive: true });
  const settings = {
    path: entry.path,
    location: 4,
    last_update_time: String((entry.loadedAtMs + WEBKIT_OFFSET_MS) * 1000),
    ...(entry.version ? { service_worker_registration_info: { version: entry.version } } : {}),
    ...(entry.active ? { active_permissions: entry.active } : {}),
  };
  const file = entry.file ?? "Secure Preferences";
  await writeFile(
    path.join(profile, file),
    JSON.stringify({ extensions: { settings: { [id]: settings } } }),
  );
  return profile;
};

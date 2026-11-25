import { readdir, utimes } from "node:fs/promises";
import path from "node:path";

/**
 * Sets the modification time of every file under a folder.
 *
 * @param root - The folder to walk.
 * @param whenMs - The time to set, as Unix milliseconds.
 */
export const setAllMtimes = async (root: string, whenMs: number): Promise<void> => {
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  for (const entry of entries.filter((item) => item.isFile())) {
    const file = path.join(entry.parentPath, entry.name);
    await utimes(file, whenMs / 1000, whenMs / 1000);
  }
};

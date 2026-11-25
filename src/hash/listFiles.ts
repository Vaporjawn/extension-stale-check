import { readdir } from "node:fs/promises";
import path from "node:path";

/**
 * Lists every file under a folder, recursively.
 *
 * @param root - The folder to walk.
 * @returns Paths relative to `root`, with `/` separators on every platform, sorted.
 */
export const listFiles = async (root: string): Promise<string[]> => {
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(root, path.join(entry.parentPath, entry.name)))
    .map((relative) => relative.split(path.sep).join("/"))
    .sort();
};

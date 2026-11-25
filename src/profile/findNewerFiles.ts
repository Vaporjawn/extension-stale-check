import { stat } from "node:fs/promises";
import path from "node:path";
import { listFiles } from "../hash/listFiles.js";

/**
 * Lists files in a folder that were modified after a moment in time.
 *
 * @param dist - The folder to scan.
 * @param sinceMs - A Unix time in milliseconds; files modified at or before it are skipped.
 * @param limit - The most files to return. Defaults to 10.
 * @returns Relative paths with `/` separators, newest first.
 */
export const findNewerFiles = async (
  dist: string,
  sinceMs: number,
  limit = 10,
): Promise<string[]> => {
  const files = await listFiles(dist);
  const modified = await Promise.all(
    files.map(async (file) => ({ file, mtimeMs: (await stat(path.join(dist, file))).mtimeMs })),
  );
  return modified
    .filter((item) => item.mtimeMs > sinceMs)
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, limit)
    .map((item) => item.file);
};

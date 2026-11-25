import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { listFiles } from "./listFiles.js";

/** What {@link computeBuildHash} returns. */
export interface BuildHash {
  /** Hex SHA-256 over every file's relative path and contents. */
  readonly hash: string;
  /** How many files went into the hash. */
  readonly fileCount: number;
}

/** Options for {@link computeBuildHash}. */
export interface BuildHashOptions {
  /** Return `true` for a relative path (`/` separators) to leave that file out, e.g. source maps. */
  readonly exclude?: (relativePath: string) => boolean;
}

/**
 * Hashes a built extension folder, so two builds can be told apart (or shown identical) by one string.
 *
 * The hash covers each file's relative path and bytes in sorted order, so it does not depend on
 * modification times, the platform, or the order the file system lists entries in.
 *
 * @param dist - The built extension folder.
 * @param options - An optional filter for files to leave out.
 * @returns The hash and the number of files it covers.
 */
export const computeBuildHash = async (
  dist: string,
  options: BuildHashOptions = {},
): Promise<BuildHash> => {
  const files = (await listFiles(dist)).filter((file) => !options.exclude?.(file));
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file);
    hash.update("\0");
    hash.update(await readFile(path.join(dist, file)));
    hash.update("\0");
  }
  return { hash: hash.digest("hex"), fileCount: files.length };
};

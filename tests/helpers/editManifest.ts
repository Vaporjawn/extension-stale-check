import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Rewrites a built extension's `manifest.json` through a callback.
 *
 * @param dist - The extension folder.
 * @param edit - Receives the parsed manifest and changes it in place.
 */
export const editManifest = async (
  dist: string,
  edit: (manifest: Record<string, unknown>) => void,
): Promise<void> => {
  const file = path.join(dist, "manifest.json");
  const manifest = JSON.parse(await readFile(file, "utf8")) as Record<string, unknown>;
  edit(manifest);
  await writeFile(file, `${JSON.stringify(manifest, null, 2)}\n`);
};

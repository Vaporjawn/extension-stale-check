import { cp, mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Copies the fixture extension into a new temporary folder, so a test can edit it freely.
 *
 * @returns The path of the copy, which holds `manifest.json`.
 */
export const copyFixture = async (): Promise<string> => {
  const source = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../fixtures/extension",
  );
  const target = await mkdtemp(path.join(os.tmpdir(), "esc-fixture-"));
  await cp(source, target, { recursive: true });
  return target;
};

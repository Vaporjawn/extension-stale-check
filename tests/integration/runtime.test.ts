import { rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { StaleExtensionError } from "../../src/errors/StaleExtensionError.js";
import { launchExtension, type LaunchedExtension } from "../../src/playwright/launchExtension.js";
import { assertExtensionFresh } from "../../src/runtime/assertExtensionFresh.js";
import { checkRuntimeFreshness } from "../../src/runtime/checkRuntimeFreshness.js";
import { readLoadedManifest } from "../../src/runtime/readLoadedManifest.js";
import { copyFixture } from "../helpers/copyFixture.js";
import { editManifest } from "../helpers/editManifest.js";

// One real browser for the whole file. Tests run in order, and each edits the extension on disk.
let dist: string;
let launched: LaunchedExtension;

beforeAll(async () => {
  dist = await copyFixture();
  launched = await launchExtension({ dist });
});

afterAll(async () => {
  await launched.close();
  await rm(dist, { recursive: true, force: true });
});

describe("a real extension in headless Chromium", () => {
  it("starts the extension and finds its id", () => {
    expect(launched.extensionId).toMatch(/^[a-p]{32}$/);
    expect(launched.worker.url()).toBe(`chrome-extension://${launched.extensionId}/background.js`);
  });

  it("reads the manifest the browser loaded", async () => {
    const loaded = await readLoadedManifest(launched.worker);
    expect(loaded["version"]).toBe("1.0.0");
    expect(loaded["manifest_version"]).toBe(3);
  });

  it("is fresh right after launch, with no spurious differences from Chrome's own parsing", async () => {
    const report = await checkRuntimeFreshness({ target: launched.worker, dist });
    expect(report.differences).toEqual([]);
    expect(report.status).toBe("fresh");
    expect(report.loadedVersion).toBe("1.0.0");
    expect(report.message).toMatch(/^Extension is fresh/);
  });

  it("does not flag the translated name as a difference", async () => {
    const loaded = await readLoadedManifest(launched.worker);
    expect(loaded["name"]).toBe("Stale Check Fixture"); // Chrome swapped the __MSG_extName__ placeholder
    expect((await checkRuntimeFreshness({ target: launched.worker, dist })).status).toBe("fresh");
  });

  it("stays fresh when only a script file changes, because the manifest is what it can see", async () => {
    await writeFile(path.join(dist, "content.js"), "// edited\n");
    expect((await checkRuntimeFreshness({ target: launched.worker, dist })).status).toBe("fresh");
  });

  it("goes stale when the version in dist/ moves on, and says so", async () => {
    await editManifest(dist, (m) => (m["version"] = "1.0.1"));
    const report = await checkRuntimeFreshness({ target: launched.worker, dist });
    expect(report.status).toBe("stale");
    expect(report.differences).toEqual([{ path: "version", loaded: "1.0.0", disk: "1.0.1" }]);
    expect(report.message).toContain("stale, reload needed");
    expect(report.message).toContain("1.0.0");
    expect(report.message).toContain("1.0.1");
  });

  it("assertExtensionFresh throws a StaleExtensionError that carries the report", async () => {
    const error = await assertExtensionFresh({ target: launched.worker, dist }).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(StaleExtensionError);
    expect((error as StaleExtensionError).report.differences).toHaveLength(1);
    expect((error as Error).message).toContain("reload needed");
  });

  it("catches a permission added to the manifest after the load", async () => {
    await editManifest(dist, (m) => (m["permissions"] = ["storage", "alarms"]));
    const report = await checkRuntimeFreshness({ target: launched.worker, dist });
    expect(report.differences.map((d) => d.path)).toEqual(["permissions[1]", "version"]);
  });

  it("restarting the browser loads the new manifest and the extension reports fresh", async () => {
    const before = launched.extensionId;
    await launched.restart();
    const report = await assertExtensionFresh({ target: launched.worker, dist });
    expect(report.status).toBe("fresh");
    expect(report.loadedVersion).toBe("1.0.1");
    expect(launched.worker.url()).toContain(launched.extensionId);
    expect(launched.extensionId).toBe(before); // same folder, so the same id
  });

  it("can ignore a path on request", async () => {
    await editManifest(dist, (m) => (m["description"] = "changed on disk"));
    const options = { target: launched.worker, dist };
    expect((await checkRuntimeFreshness(options)).status).toBe("stale");
    expect((await checkRuntimeFreshness({ ...options, ignorePaths: ["description"] })).status).toBe(
      "fresh",
    );
  });
});

describe("misuse", () => {
  it("explains when the target is not an extension context", async () => {
    const page = await launched.context.newPage();
    await page.goto("about:blank");
    await expect(readLoadedManifest(page)).rejects.toThrow(
      /chrome\.runtime\.getManifest\(\) is not available/,
    );
    await page.close();
  });

  it("refuses a folder with no manifest before starting a browser", async () => {
    await expect(launchExtension({ dist: "/no/such/extension" })).rejects.toThrow(
      /No manifest\.json/,
    );
  });
});

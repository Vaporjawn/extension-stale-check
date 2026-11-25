import { mkdir, rm, symlink, utimes, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkProfileFreshness } from "../../src/profile/checkProfileFreshness.js";
import { editManifest } from "../helpers/editManifest.js";
import { makeScenario } from "../helpers/makeScenario.js";
import { writeProfile } from "../helpers/writeProfile.js";

describe("checkProfileFreshness", () => {
  it("is fresh when the profile agrees with dist/ and nothing is newer", async () => {
    const { dist, userDataDir } = await makeScenario();
    const report = await checkProfileFreshness({ dist, userDataDir });
    expect(report).toMatchObject({
      status: "fresh",
      differences: [],
      newerFiles: [],
      diskVersion: "1.0.0",
    });
    expect(report.extensionId).toBe("abcdefghijklmnopabcdefghijklmnop");
  });

  it("is stale when the version in dist/ moved on", async () => {
    const { dist, userDataDir } = await makeScenario();
    await editManifest(dist, (m) => (m["version"] = "1.0.1"));
    const report = await checkProfileFreshness({ dist, userDataDir });
    expect(report.status).toBe("stale");
    expect(report.differences).toEqual([{ path: "version", loaded: "1.0.0", disk: "1.0.1" }]);
    expect(report.registeredVersion).toBe("1.0.0");
  });

  it("is stale when a build added a permission", async () => {
    const { dist, userDataDir } = await makeScenario();
    await editManifest(dist, (m) => (m["permissions"] = ["storage", "alarms", "tabs"]));
    const report = await checkProfileFreshness({ dist, userDataDir });
    expect(report.status).toBe("stale");
    expect(report.differences.map((d) => d.path)).toEqual(["permissions"]);
  });

  it("is stale when a build removed a permission", async () => {
    const { dist, userDataDir } = await makeScenario();
    await editManifest(dist, (m) => (m["permissions"] = ["storage"]));
    expect((await checkProfileFreshness({ dist, userDataDir })).status).toBe("stale");
  });

  it("is stale when a build added a host permission", async () => {
    const { dist, userDataDir } = await makeScenario();
    await editManifest(
      dist,
      (m) => (m["host_permissions"] = ["https://a.test/*", "https://c.test/*"]),
    );
    const report = await checkProfileFreshness({ dist, userDataDir });
    expect(report.differences.map((d) => d.path)).toEqual(["host_permissions"]);
  });

  it("is stale when a content script now matches another site", async () => {
    const { dist, userDataDir } = await makeScenario();
    await editManifest(dist, (m) => {
      m["content_scripts"] = [
        { matches: ["https://a.test/*", "https://z.test/*"], js: ["content.js"] },
      ];
    });
    const report = await checkProfileFreshness({ dist, userDataDir });
    expect(report.differences.map((d) => d.path)).toEqual(["content_scripts[].matches"]);
  });

  it("counts a host pattern listed under permissions (Manifest V2 style) as a host permission", async () => {
    const { dist, userDataDir } = await makeScenario();
    await editManifest(dist, (m) => {
      m["permissions"] = ["storage", "alarms", "https://a.test/*"];
      delete m["host_permissions"];
    });
    // Editing the manifest also bumps its mtime, so look at the comparison, not the overall status.
    expect((await checkProfileFreshness({ dist, userDataDir })).differences).toEqual([]);
  });

  it("is possibly stale when a file changed after the load but the manifest still matches", async () => {
    const { dist, userDataDir, loadedAtMs } = await makeScenario();
    const later = new Date(loadedAtMs + 5000);
    await utimes(path.join(dist, "content.js"), later, later);
    const report = await checkProfileFreshness({ dist, userDataDir });
    expect(report.status).toBe("possibly-stale");
    expect(report.newerFiles).toEqual(["content.js"]);
  });

  it("lets toleranceMs absorb a build that finished just after the load", async () => {
    const { dist, userDataDir, loadedAtMs } = await makeScenario();
    const later = new Date(loadedAtMs + 5000);
    await utimes(path.join(dist, "content.js"), later, later);
    expect((await checkProfileFreshness({ dist, userDataDir, toleranceMs: 10_000 })).status).toBe(
      "fresh",
    );
    expect((await checkProfileFreshness({ dist, userDataDir, toleranceMs: 1000 })).status).toBe(
      "possibly-stale",
    );
  });

  it("reports stale ahead of possibly-stale when both apply", async () => {
    const { dist, userDataDir, loadedAtMs } = await makeScenario();
    await editManifest(dist, (m) => (m["version"] = "9.9.9"));
    const later = new Date(loadedAtMs + 5000);
    await utimes(path.join(dist, "content.js"), later, later);
    const report = await checkProfileFreshness({ dist, userDataDir });
    expect(report.status).toBe("stale");
    expect(report.newerFiles.length).toBeGreaterThan(0);
  });

  it("lists at most ten newer files, newest first", async () => {
    const { dist, userDataDir, loadedAtMs } = await makeScenario();
    for (let index = 0; index < 14; index += 1) {
      const file = path.join(dist, `f${String(index)}.js`);
      await writeFile(file, "//");
      const when = new Date(loadedAtMs + 1000 + index * 1000);
      await utimes(file, when, when);
    }
    const report = await checkProfileFreshness({ dist, userDataDir });
    expect(report.newerFiles).toHaveLength(10);
    expect(report.newerFiles[0]).toBe("f13.js");
  });

  it("is not-loaded when the profile has no extension from that folder", async () => {
    const { dist, userDataDir } = await makeScenario();
    await mkdir(path.join(userDataDir, "x"));
    const other = await makeScenario();
    const report = await checkProfileFreshness({ dist: other.dist, userDataDir });
    expect(report.status).toBe("not-loaded");
    expect(report.extensionId).toBeUndefined();
    expect(report.message).toContain("chrome://extensions");
    expect(dist).not.toBe(other.dist);
  });

  it("finds the extension even when dist/ is reached through a symlink or has a trailing slash", async () => {
    const { dist, userDataDir } = await makeScenario();
    const link = path.join(path.dirname(dist), "link");
    await symlink(dist, link);
    expect((await checkProfileFreshness({ dist: link, userDataDir })).status).toBe("fresh");
    expect((await checkProfileFreshness({ dist: `${dist}/`, userDataDir })).status).toBe("fresh");
  });

  it("reads an entry stored in Preferences instead of Secure Preferences", async () => {
    const { dist, userDataDir, loadedAtMs } = await makeScenario({ file: "Preferences" });
    await rm(path.join(userDataDir, "Default", "Secure Preferences"), { force: true });
    expect(loadedAtMs).toBeGreaterThan(0);
    expect((await checkProfileFreshness({ dist, userDataDir })).status).toBe("fresh");
  });

  it("picks the most recently loaded entry when the folder was loaded twice", async () => {
    const { dist, userDataDir, loadedAtMs } = await makeScenario();
    await writeProfile(
      userDataDir,
      { path: dist, loadedAtMs: loadedAtMs - 3_600_000, version: "0.5.0" },
      "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",
    );
    // writeProfile overwrote the file: put the recent entry back alongside the old one.
    const profile = path.join(userDataDir, "Default", "Secure Preferences");
    const old = JSON.parse(await (await import("node:fs/promises")).readFile(profile, "utf8")) as {
      extensions: { settings: Record<string, unknown> };
    };
    const recent = await makeScenario();
    old.extensions.settings["recentrecentrecentrecentrecent"] = {
      path: dist,
      last_update_time: String((loadedAtMs + 11_644_473_600_000) * 1000),
      service_worker_registration_info: { version: "1.0.0" },
    };
    await writeFile(profile, JSON.stringify(old));
    const report = await checkProfileFreshness({ dist, userDataDir });
    expect(report.extensionId).toBe("recentrecentrecentrecentrecent");
    expect(recent.dist).not.toBe(dist);
  });

  it("explains when the profile folder is missing", async () => {
    const { dist } = await makeScenario();
    await expect(
      checkProfileFreshness({ dist, userDataDir: "/definitely/not/here" }),
    ).rejects.toThrow(/No Preferences or Secure Preferences/);
  });

  it("explains when dist/ has no manifest", async () => {
    const { userDataDir } = await makeScenario();
    await expect(checkProfileFreshness({ dist: "/tmp/no-such-dist", userDataDir })).rejects.toThrow(
      /No manifest\.json/,
    );
  });

  it("skips the permission comparison when the profile recorded none", async () => {
    const { dist, userDataDir, loadedAtMs } = await makeScenario();
    await writeProfile(userDataDir, { path: dist, loadedAtMs, version: "1.0.0" });
    await editManifest(dist, (m) => (m["permissions"] = ["tabs"]));
    expect((await checkProfileFreshness({ dist, userDataDir })).differences).toEqual([]);
  });
});

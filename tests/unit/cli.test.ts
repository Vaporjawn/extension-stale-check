import { utimes } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseCliArguments } from "../../src/cli/parseCliArguments.js";
import { runCli } from "../../src/cli/runCli.js";
import { VERSION } from "../../src/cli/version.js";
import { editManifest } from "../helpers/editManifest.js";
import { makeScenario } from "../helpers/makeScenario.js";

/**
 * Runs the CLI and captures what it printed.
 *
 * @param argv - The command-line arguments.
 * @returns The exit code and everything written to stdout and stderr.
 */
const run = async (argv: string[]) => {
  let out = "";
  let err = "";
  const code = await runCli(argv, { out: (t) => (out += t), err: (t) => (err += t) });
  return { code, out, err };
};

describe("parseCliArguments", () => {
  it("treats a bare path as `check <path>`", () => {
    expect(parseCliArguments(["dist"])).toMatchObject({
      kind: "check",
      dist: "dist",
      json: false,
      strict: false,
    });
  });

  it("accepts the explicit check and hash subcommands", () => {
    expect(parseCliArguments(["check", "dist"])).toMatchObject({ kind: "check", dist: "dist" });
    expect(parseCliArguments(["hash", "dist", "--json"])).toEqual({
      kind: "hash",
      dist: "dist",
      json: true,
    });
  });

  it("reads every option", () => {
    expect(
      parseCliArguments([
        "d",
        "--browser",
        "brave",
        "--user-data-dir",
        "/u",
        "--profile",
        "P1",
        "--tolerance-ms",
        "250",
        "--strict",
        "--json",
      ]),
    ).toEqual({
      kind: "check",
      dist: "d",
      json: true,
      strict: true,
      browser: "brave",
      userDataDir: "/u",
      profile: "P1",
      toleranceMs: 250,
    });
  });

  it("recognises help and version, long and short", () => {
    expect(parseCliArguments(["--help"]).kind).toBe("help");
    expect(parseCliArguments(["-h"]).kind).toBe("help");
    expect(parseCliArguments(["--version"]).kind).toBe("version");
    expect(parseCliArguments(["-v"]).kind).toBe("version");
  });

  it.each([
    [[], /Missing <dist>/],
    [["check"], /Missing <dist>/],
    [["a", "b"], /Unexpected argument: b/],
    [["a", "--browser", "firefox"], /--browser must be one of/],
    [["a", "--tolerance-ms", "-5"], /--tolerance-ms/],
    [["a", "--tolerance-ms", "soon"], /--tolerance-ms/],
    [["a", "--nope"], /Unknown option/],
  ])("rejects %j", (argv, message) => {
    const command = parseCliArguments(argv);
    expect(command).toMatchObject({ kind: "error" });
    expect((command as { message: string }).message).toMatch(message);
  });
});

describe("runCli", () => {
  it("prints help and the version", async () => {
    expect((await run(["--help"])).out).toContain("Exit codes");
    expect(await run(["--version"])).toMatchObject({ code: 0, out: `${VERSION}\n` });
  });

  it("exits 0 for a fresh extension", async () => {
    const { dist, userDataDir } = await makeScenario();
    const result = await run([dist, "--user-data-dir", userDataDir]);
    expect(result.code).toBe(0);
    expect(result.out).toMatch(/^Fresh:/);
  });

  it("exits 1 for a stale extension and names what differs", async () => {
    const { dist, userDataDir } = await makeScenario();
    await editManifest(dist, (m) => (m["version"] = "2.0.0"));
    const result = await run([dist, "--user-data-dir", userDataDir]);
    expect(result.code).toBe(1);
    expect(result.out).toContain("differs: version");
  });

  it("exits 0 for possibly stale, and 1 with --strict", async () => {
    const { dist, userDataDir, loadedAtMs } = await makeScenario();
    const later = new Date(loadedAtMs + 5000);
    await utimes(path.join(dist, "content.js"), later, later);
    expect((await run([dist, "--user-data-dir", userDataDir])).code).toBe(0);
    expect((await run([dist, "--user-data-dir", userDataDir, "--strict"])).code).toBe(1);
  });

  it("exits 2 when the extension is not loaded in that profile", async () => {
    const other = await makeScenario();
    const { userDataDir } = await makeScenario();
    expect((await run([other.dist, "--user-data-dir", userDataDir])).code).toBe(2);
  });

  it("exits 2 with a message on stderr for a bad folder", async () => {
    const result = await run(["/no/such/dist"]);
    expect(result.code).toBe(2);
    expect(result.err).toContain("No manifest.json");
  });

  it("exits 2 with usage on a bad argument", async () => {
    const result = await run(["--browser", "firefox", "d"]);
    expect(result.code).toBe(2);
    expect(result.err).toContain("--help");
  });

  it("prints a parseable JSON report with --json", async () => {
    const { dist, userDataDir } = await makeScenario();
    const report = JSON.parse(
      (await run([dist, "--user-data-dir", userDataDir, "--json"])).out,
    ) as { status: string };
    expect(report.status).toBe("fresh");
  });

  it("hashes a folder, as text and as JSON", async () => {
    const { dist } = await makeScenario();
    const text = await run(["hash", dist]);
    expect(text.out).toMatch(/^[0-9a-f]{64} {2}2 files\n$/);
    const json = JSON.parse((await run(["hash", dist, "--json"])).out) as {
      hash: string;
      fileCount: number;
    };
    expect(json.fileCount).toBe(2);
    expect(text.out.startsWith(json.hash)).toBe(true);
  });
});

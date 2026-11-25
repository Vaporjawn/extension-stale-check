import { describe, expect, it } from "vitest";
import { resolveUserDataDir } from "../../src/profile/resolveUserDataDir.js";

describe("resolveUserDataDir", () => {
  it("finds Chrome on macOS", () => {
    expect(resolveUserDataDir({ platform: "darwin", home: "/Users/a" })).toBe(
      "/Users/a/Library/Application Support/Google/Chrome",
    );
  });

  it("finds Chrome on Linux", () => {
    expect(resolveUserDataDir({ platform: "linux", home: "/home/a" })).toBe(
      "/home/a/.config/google-chrome",
    );
  });

  it("finds Chrome on Windows through LOCALAPPDATA", () => {
    const dir = resolveUserDataDir({
      platform: "win32",
      home: "C:\\Users\\a",
      env: { LOCALAPPDATA: "D:\\Local" },
    });
    expect(dir.replaceAll("\\", "/")).toMatch(/D:\/Local\/Google\/Chrome\/User Data$/);
  });

  it("falls back to AppData/Local on Windows when LOCALAPPDATA is unset", () => {
    const dir = resolveUserDataDir({ platform: "win32", home: "/h", env: {} });
    expect(dir.replaceAll("\\", "/")).toMatch(/\/h\/AppData\/Local\/Google\/Chrome\/User Data$/);
  });

  it.each([
    ["chromium", "/Users/a/Library/Application Support/Chromium"],
    ["brave", "/Users/a/Library/Application Support/BraveSoftware/Brave-Browser"],
    ["edge", "/Users/a/Library/Application Support/Microsoft Edge"],
  ] as const)("finds %s on macOS", (browser, expected) => {
    expect(resolveUserDataDir({ browser, platform: "darwin", home: "/Users/a" })).toBe(expected);
  });

  it("refuses a platform it has no location for", () => {
    expect(() => resolveUserDataDir({ platform: "freebsd" })).toThrow(/freebsd/);
  });
});

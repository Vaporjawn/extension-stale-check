import { describe, expect, it } from "vitest";
import { webkitTimeToDate } from "../../src/profile/webkitTimeToDate.js";

describe("webkitTimeToDate", () => {
  it("converts a value read from a real Chrome profile", () => {
    expect(webkitTimeToDate("13440040218052386")?.toISOString()).toBe("2026-11-25T00:30:18.052Z");
  });

  it("maps Chrome's epoch offset to the Unix epoch", () => {
    expect(webkitTimeToDate("11644473600000000")?.getTime()).toBe(0);
  });

  it("accepts a number as well as a string", () => {
    expect(webkitTimeToDate(11_644_473_600_000_000)?.getTime()).toBe(0);
  });

  it.each([undefined, null, "", "abc", {}, "1.5"])("returns undefined for %j", (value) => {
    expect(webkitTimeToDate(value)).toBeUndefined();
  });
});

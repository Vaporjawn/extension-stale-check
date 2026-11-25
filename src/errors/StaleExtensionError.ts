import type { RuntimeReport } from "../types.js";

/** Thrown when the extension a browser is running no longer matches `dist/`. */
export class StaleExtensionError extends Error {
  /** The full comparison that found the difference. */
  public readonly report: RuntimeReport;

  /**
   * Builds the error from the comparison that found the extension stale, using its message.
   *
   * @param report - The comparison that found the extension stale.
   */
  public constructor(report: RuntimeReport) {
    super(report.message);
    this.name = "StaleExtensionError";
    this.report = report;
  }
}

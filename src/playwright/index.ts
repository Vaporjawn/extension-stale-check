export { createExtensionTest } from "./createExtensionTest.js";
export type { ExtensionTestOptions, FreshnessResult } from "./createExtensionTest.js";
export { launchExtension } from "./launchExtension.js";
export type { LaunchedExtension, LaunchOptions } from "./launchExtension.js";
export { assertExtensionFresh } from "../runtime/assertExtensionFresh.js";
export { checkRuntimeFreshness } from "../runtime/checkRuntimeFreshness.js";
export { StaleExtensionError } from "../errors/StaleExtensionError.js";

export { StaleExtensionError } from "./errors/StaleExtensionError.js";
export { computeBuildHash } from "./hash/computeBuildHash.js";
export type { BuildHash, BuildHashOptions } from "./hash/computeBuildHash.js";
export { diffManifests } from "./manifest/diffManifests.js";
export type { DiffOptions } from "./manifest/diffManifests.js";
export { readDiskManifest } from "./manifest/readDiskManifest.js";
export { checkProfileFreshness } from "./profile/checkProfileFreshness.js";
export type { ProfileCheckOptions } from "./profile/checkProfileFreshness.js";
export { resolveUserDataDir } from "./profile/resolveUserDataDir.js";
export type { ResolveUserDataDirOptions } from "./profile/resolveUserDataDir.js";
export { assertExtensionFresh } from "./runtime/assertExtensionFresh.js";
export { checkRuntimeFreshness } from "./runtime/checkRuntimeFreshness.js";
export type { RuntimeCheckOptions } from "./runtime/checkRuntimeFreshness.js";
export { readLoadedManifest } from "./runtime/readLoadedManifest.js";
export type {
  BrowserName,
  Evaluable,
  JsonObject,
  ManifestDifference,
  ProfileReport,
  RuntimeReport,
} from "./types.js";

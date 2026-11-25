/**
 * Whether a manifest permission string is a host pattern (`https://x/*`, `<all_urls>`) rather than
 * an API name (`storage`). Manifest V2 mixed both in `permissions`.
 *
 * @param permission - One entry from `permissions` or `host_permissions`.
 * @returns `true` for host patterns.
 */
export const isHostPattern = (permission: string): boolean =>
  permission === "<all_urls>" || permission.includes("://");

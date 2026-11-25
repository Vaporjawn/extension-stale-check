import { defineConfig } from "@playwright/test";

// The fixtures under test launch their own headless Chromium, so no `projects` or `use.browser` here.
export default defineConfig({
  testDir: "e2e",
  workers: 1,
  timeout: 60_000,
  reporter: "list",
  forbidOnly: Boolean(process.env["CI"]),
});

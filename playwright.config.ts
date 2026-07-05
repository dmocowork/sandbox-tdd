import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/acceptance",
  retries: 2, // absorbe la flakiness réseau des previews
  use: {
    baseURL: process.env.BASE_URL,
    trace: "retain-on-failure",
    extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? { "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET }
      : {},
  },
});

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  retries: process.env.CI ? 1 : 0,
  maxFailures: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4198",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
      args: ["--use-gl=angle", "--enable-unsafe-swiftshader"],
    },
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 900 } } },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "npx vite --host 127.0.0.1 --port 4198 --strictPort",
    url: "http://127.0.0.1:4198",
    reuseExistingServer: false,
    timeout: 30000,
  },
});

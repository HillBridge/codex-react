import { defineConfig, devices } from "@playwright/test";

// e2e 使用独立端口的后端并始终新起，每次运行都从初始数据开始，也不会改动开发中的服务。
const apiPort = 3101;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // H5 在 iOS 上用 WebKit：100vh、安全区、触摸等差异只有 WebKit 能复现，所以手机布局用例额外在它上面跑一遍。
    // 首次使用需执行 pnpm exec playwright install webkit。
    {
      name: "mobile-safari",
      testMatch: "mobile-layout.spec.ts",
      use: { ...devices["iPhone 14"] },
    },
  ],
  webServer: [
    {
      command: "pnpm dev:backend",
      env: { PORT: String(apiPort) },
      url: `http://127.0.0.1:${apiPort}/health`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: "pnpm dev --host 127.0.0.1 --port 4173",
      env: { API_PROXY_TARGET: `http://127.0.0.1:${apiPort}` },
      url: "http://127.0.0.1:4173",
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
});

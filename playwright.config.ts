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
    ...devices["Desktop Chrome"],
  },
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

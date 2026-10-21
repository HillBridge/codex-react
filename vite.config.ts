import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@contracts": fileURLToPath(new URL("./contracts", import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // 第三方依赖拆成稳定命名的块：业务代码发版时，这些块的浏览器缓存不会失效。
        codeSplitting: {
          groups: [
            {
              name: "vendor-react",
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            },
            { name: "vendor-router", test: /node_modules[\\/]react-router/ },
            {
              name: "vendor-aria",
              test: /node_modules[\\/](react-aria-components|react-aria|react-stately|@react-aria|@react-stately|@react-types|@internationalized|@swc[\\/]helpers)/,
            },
            { name: "vendor-query", test: /node_modules[\\/]@tanstack/ },
            {
              name: "vendor-form",
              test: /node_modules[\\/](react-hook-form|@hookform|zod)[\\/]/,
            },
            { name: "vendor-misc", test: /node_modules[\\/](axios|sonner)[\\/]/ },
          ],
        },
      },
    },
  },
  server: {
    proxy: {
      // e2e 用独立端口的后端，避免复用开发中的服务而污染其内存数据。
      "/api": process.env.API_PROXY_TARGET ?? "http://127.0.0.1:3001",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    clearMocks: true,
    include: [
      "src/**/*.test.{ts,tsx}",
      "backend/src/**/*.test.ts",
      "contracts/**/*.test.ts",
    ],
    exclude: ["tests/e2e/**", "node_modules/**", "dist/**"],
  },
});

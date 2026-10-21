// 把后端连同 @merchant/contracts 和第三方依赖打成单个 dist/server.js。
// 产物不需要 node_modules 和 tsx，镜像里只放这一个文件即可运行。
import { build } from "esbuild";

await build({
  entryPoints: ["src/server.ts"],
  outfile: "dist/server.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  sourcemap: true,
  logLevel: "info",
  // 部分依赖是 CommonJS，打进 ESM 产物后需要 require 才能工作。
  banner: {
    js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
  },
});

import fs from "node:fs";
import eslint from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

// Feature-Sliced Design：层级自上而下依赖，同层切片互不依赖，跨切片只能走公共出口（index.ts）。
const layers = ["app", "pages", "widgets", "features", "entities", "shared"];
const sliceLayers = ["pages", "widgets", "features", "entities"];

const slicesOf = (layer) =>
  fs.existsSync(`src/${layer}`)
    ? fs
        .readdirSync(`src/${layer}`, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    : [];

const restrict = (group, message) => ({ group, message });

// 切片内部文件只能通过 index.ts 被外部使用，禁止 @/features/orders/api 这类深层引用。
const deepImport = restrict(
  sliceLayers.map((layer) => `@/${layer}/*/**`),
  "FSD：跨切片只能从切片的公共出口（index.ts）引入；切片内部请使用相对路径。",
);

const upperLayers = (layer) =>
  layers
    .slice(0, layers.indexOf(layer))
    .flatMap((upper) => [`@/${upper}`, `@/${upper}/**`]);

const fsdBlock = (files, patterns) => ({
  files,
  rules: {
    "no-restricted-imports": [
      "error",
      // 没有可限制的目标时（如某层只有一个切片）跳过，空 group 会让 ESLint 报配置错误。
      { patterns: patterns.filter((pattern) => pattern.group.length > 0) },
    ],
  },
});

const fsdBlocks = [
  fsdBlock(["src/**/*.{ts,tsx}"], [deepImport]),
  ...layers
    .filter((layer) => layer !== "app")
    .map((layer) =>
      fsdBlock(
        [`src/${layer}/**/*.{ts,tsx}`],
        [restrict(upperLayers(layer), "FSD：下层不能依赖上层。"), deepImport],
      ),
    ),
  ...sliceLayers.flatMap((layer) =>
    slicesOf(layer).map((slice) =>
      fsdBlock(
        [`src/${layer}/${slice}/**/*.{ts,tsx}`],
        [
          restrict(upperLayers(layer), "FSD：下层不能依赖上层。"),
          restrict(
            slicesOf(layer)
              .filter((other) => other !== slice)
              .flatMap((other) => [`@/${layer}/${other}`, `@/${layer}/${other}/**`]),
            "FSD：同一层的切片之间不能互相依赖，需要共享时下沉到更低的层。",
          ),
          deepImport,
        ],
      ),
    ),
  ),
];

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}", "vite.config.ts"],
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.flat.recommended.rules,
  },
  ...fsdBlocks,
  // 集成测试需要把真实路由与业务切片组装在一起，允许跨层，但仍禁止深层引用。
  fsdBlock(["src/**/*.integration.test.{ts,tsx}"], [deepImport]),
);

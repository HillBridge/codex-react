import fs from "node:fs";
import eslint from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

// 前端应用的根目录；FSD 规则只作用于这里。
const web = "apps/web/src";

// Feature-Sliced Design：层级自上而下依赖，同层切片互不依赖，跨切片只能走公共出口（index.ts）。
const layers = ["app", "pages", "widgets", "features", "entries", "shared"];
const sliceLayers = ["pages", "widgets", "features", "entries"];

const slicesOf = (layer) =>
  fs.existsSync(`${web}/${layer}`)
    ? fs
        .readdirSync(`${web}/${layer}`, { withFileTypes: true })
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

// entries 只放业务对象本身（类型、展示规则），不含用户操作和数据请求。
const layerExtras = {
  entries: [
    restrict(
      ["@tanstack/react-query", "@/shared/api", "@/shared/api/**"],
      "FSD：entries 只放类型与展示规则，数据请求和 query/mutation 属于 features。",
    ),
  ],
};

// Monorepo 边界：用包名或相对路径跨过应用目录都算违规。
const webOnly = ["**/web/**", "@merchant/web", "@merchant/web/**"];
const serverOnly = ["**/server/**", "@merchant/server", "@merchant/server/**"];
const crossApp = restrict(
  serverOnly,
  "Monorepo：web 不能依赖 server，共享的契约请放到 packages/contracts。",
);

const boundaryBlock = (files, patterns) => ({
  files,
  rules: { "no-restricted-imports": ["error", { patterns }] },
});

const fsdBlock = (files, patterns) => ({
  files,
  rules: {
    "no-restricted-imports": [
      "error",
      // 没有可限制的目标时（如某层只有一个切片）跳过，空 group 会让 ESLint 报配置错误。
      { patterns: [...patterns, crossApp].filter((pattern) => pattern.group.length > 0) },
    ],
  },
});

const fsdBlocks = [
  fsdBlock([`${web}/**/*.{ts,tsx}`], [deepImport]),
  ...layers
    .filter((layer) => layer !== "app")
    .map((layer) =>
      fsdBlock(
        [`${web}/${layer}/**/*.{ts,tsx}`],
        [
          restrict(upperLayers(layer), "FSD：下层不能依赖上层。"),
          deepImport,
          ...(layerExtras[layer] ?? []),
        ],
      ),
    ),
  ...sliceLayers.flatMap((layer) =>
    slicesOf(layer).map((slice) =>
      fsdBlock(
        [`${web}/${layer}/${slice}/**/*.{ts,tsx}`],
        [
          restrict(upperLayers(layer), "FSD：下层不能依赖上层。"),
          restrict(
            slicesOf(layer)
              .filter((other) => other !== slice)
              .flatMap((other) => [`@/${layer}/${other}`, `@/${layer}/${other}/**`]),
            "FSD：同一层的切片之间不能互相依赖，需要共享时下沉到更低的层。",
          ),
          deepImport,
          ...(layerExtras[layer] ?? []),
        ],
      ),
    ),
  ),
];

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "test-results/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["apps/web/src/**/*.{ts,tsx}", "apps/web/vite.config.ts"],
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.flat.recommended.rules,
  },
  // 构建脚本运行在 Node 里。
  {
    files: ["scripts/**/*.mjs", "apps/**/*.mjs"],
    languageOptions: { globals: { console: "readonly", process: "readonly" } },
  },
  ...fsdBlocks,
  // Monorepo 边界：应用之间互不依赖，契约包不依赖任何应用。共享内容只能放进 packages/*，并通过包名引用其公共出口。
  boundaryBlock(
    ["apps/server/**/*.ts"],
    [
      restrict(
        webOnly,
        "Monorepo：server 不能依赖 web，共享的契约请放到 packages/contracts。",
      ),
    ],
  ),
  boundaryBlock(
    ["packages/contracts/**/*.ts"],
    [
      restrict(
        [...webOnly, ...serverOnly],
        "Monorepo：contracts 不能依赖任何应用，只能依赖 zod。",
      ),
    ],
  ),
  // 集成测试需要把真实路由与业务切片组装在一起，允许跨层，但仍禁止深层引用。
  fsdBlock([`${web}/**/*.integration.test.{ts,tsx}`], [deepImport]),
);

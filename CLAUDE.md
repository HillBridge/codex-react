# 项目约定

## 项目概览

`merchant-admin-foundation`：商户后台（订单、商品、结算、概览），前后端同仓库，TypeScript + pnpm，Node >= 22.12。

```
浏览器 ──(Vite dev proxy /api)──▶ Koa 后端（内存数据）
  │
  └─ React SPA：FSD 分层
```

- 前端：`src/`，按下文 FSD 分层。
- 后端：`backend/src/`，Koa 分层：`routes`（auth、orders、products、settlements、overview）、`auth`（session、require-user 中间件）、`lib`（request-id、pagination、errors）、`data`（demo-data + 内存 store）。用 `koa-static` 托管构建产物。数据在内存中，重启即重置，适合演示和 e2e，不是生产持久化方案。
- 契约：`contracts/` 放前后端共用的 zod 校验规则（目前有 `product.ts`），是规则的唯一来源。前端用别名 `@contracts/*` 引入，后端用相对路径。
- 测试：前端和后端测试共用一套 Vitest 配置（含 `contracts/`）；e2e 在 `tests/e2e`。
- 设计文档：`docs/`（路由、UI 规范、各次演进的 spec 与 plan）。

## 技术栈

| 技术                                          | 解决的问题                                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| React 19                                      | UI 构建                                                                                                 |
| React Router 8                                | 客户端路由、路由级错误页、登录守卫（`RequireSession`）                                                  |
| TanStack Query 5                              | 服务端状态：缓存、loading/error、失效重取；配合 queryKeys 工厂按前缀批量失效                            |
| axios                                         | HTTP 请求；封装统一错误（`ApiError` 带 requestId）、401 会话过期处理                                    |
| react-aria-components                         | 无样式可访问组件基础（Dialog、表格交互等），保证键盘与屏幕阅读器支持                                    |
| sonner                                        | Toast 提示                                                                                              |
| CSS Modules + `tokens.css`                    | 样式隔离、设计令牌统一；stylelint-declaration-strict-value 强制使用令牌而非硬编码值                     |
| zod 4                                         | 校验规则的唯一来源：`contracts/` 中的 schema 同时给后端校验请求、给前端表单复用，并推导 TypeScript 类型 |
| react-hook-form + @hookform/resolvers         | 表单状态（touched、错误、提交中）的标准实现，通过 zodResolver 接入 zod                                  |
| Vite 8                                        | 开发服务器、打包、`/api` 代理（e2e 通过 `API_PROXY_TARGET` 切换代理目标）                               |
| Koa 3 + @koa/router + bodyparser + static     | 轻量后端，提供 API 并托管前端产物                                                                       |
| tsx                                           | 直接运行 TS 后端，无需编译步骤                                                                          |
| TypeScript 6                                  | 全栈类型安全，`tsc -b` 构建时检查                                                                       |
| ESLint（typescript-eslint、react-hooks）      | 代码质量，并通过规则强制 FSD：禁止反向依赖、同层切片互引、深层引用                                      |
| Prettier / Stylelint                          | 代码与样式格式、规范统一                                                                                |
| Vitest + jsdom + Testing Library + user-event | 前端组件/集成测试与后端路由测试                                                                         |
| Playwright                                    | 全链路 e2e（订单流程、工作区页面）                                                                      |
| Git hooks（`core.hooksPath`）                 | 提交前后自动门禁                                                                                        |

状态管理约定：服务端状态交给 React Query，URL 状态（筛选、分页）用 `useUrlParams`，不引入全局状态库。

## 目录架构：Feature-Sliced Design（FSD）

后续开发统一遵循 FSD。层级自上而下，**只能依赖更低的层**：

`app` → `pages` → `widgets` → `features` → `entries` → `shared`

| 层         | 放什么                                                                                                                                                    | 现状                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `app`      | 应用入口，挂载路由、全局 Provider、全局样式、`queryClient`。无切片，按职责分段                                                                            | 已有                                                                                   |
| `pages`    | 一个路由一个切片，只做 widgets/features 的组装，不写业务逻辑（约定，非技术强制）                                                                          | 已有                                                                                   |
| `widgets`  | 自带数据的完整界面块（自己调用 feature 的查询并渲染），同时为 page 之间的复用提供合法落点。**可选层**：出现跨页面复用时才建，只有一个页面用就留在 page 里 | 已有：`order-summary`、`settlement-summary`、`product-summary`，概览页和对应列表页复用 |
| `features` | 有业务价值的用户操作及其数据：数据层（`api`、`queries`、`mutations`、`queryKeys`）、交互 UI（表格、表单、弹出框）、该操作自己的 `types`                   | 已有：`orders`、`products`、`settlements`、`overview`、`session`                       |
| `entries`  | 两个以上 feature 共用的业务对象本身：只放类型和展示规则（状态文案、格式化、计算），不含用户操作和数据请求                                                 | 已有：`order`                                                                          |
| `shared`   | 与业务无关的通用能力：通用 UI（不含业务）、`api` 实例封装、全局 `hooks`、`lib` 工具函数。无切片，按职责分段                                               | 已有：`api`、`hooks`、`lib`、`ui`                                                      |

放置判断：

- 函数签名或内部规则带业务类型/业务含义（如 `getOrderStatusLabel`）放 `entries`；只处理 `number`、`string`、`Date` 等通用类型的放 `shared`，不要让业务污染 `shared`。
- 两个 feature 共用的类型或展示规则下沉到 `entries`；只有一个 feature 用就留在该 feature。
- 两个页面共用一块带数据的界面，提到 `widgets`（feature 之间不能互相引用，只有 widgets 能同时引用多个 feature）。

规则（已由 `eslint.config.js` 强制，违反则 `pnpm lint` 失败）：

- 下层不能引用上层，例如 `shared` 不能引用 `features`。
- 同一层的切片互不依赖，例如 `features/orders` 不能引用 `features/session`。需要共享时下沉到更低的层。
- 跨切片只能从公共出口引入：`@/features/orders`，不能写 `@/features/orders/api`。切片内部文件之间用相对路径。
- `entries` 不能引用 `@tanstack/react-query` 和 `@/shared/api`（数据请求属于 features）。
- 每个切片的 `index.ts` 只导出外部确实要用的成员。
- 切片内部按职责分段：`api.ts`、`queries.ts`、`mutations.ts`、`queryKeys.ts`、`types.ts`，组件各自一个文件夹。
- 通用组件放 `shared/ui`，业务配置（列定义、筛选项）留在对应 feature。
- feature 之间不能互相引用，所以跨 feature 的联动由上层负责：例如删除订单后让概览缓存失效，写在 `OrdersPage`（页面）里。
- 测试文件放在所属切片内，不要放在层的根目录。
- 集成测试（`*.integration.test.tsx`）允许跨层组装，但仍不能深层引用。

## React Query 键工厂

每个 feature 的 `queryKeys.ts` 按以下方式写：

- 文件顶部用模块私有常量声明层级根键（`xxxRoot`、`listRoot`、`detailRoot`），不作为对外成员导出。
- 导出对象只保留实际被调用的方法，不预留没人用的成员。
- 层级写在文件顶部注释里：模块 → 类型 → 商户 → 具体条件，失效按前缀匹配。
- 每个方法上方用一行注释说明用途（精确查询 / 批量失效等）。
- 只有单个键的模块，直接导出一个常量即可。

参考实现：`src/features/orders/queryKeys.ts`。

## 提交前验证

提交前钩子（`.githooks/pre-commit`）会依次执行 format:check、lint:styles、typecheck、check:deprecated、lint、test，失败则不能提交。

推送前钩子（`.githooks/pre-push`）会执行 `pnpm test:e2e`（Playwright）。e2e 使用独立端口 3101 的后端并每次新起，不影响开发中的服务；因为较慢，所以不放在提交钩子里。

## 表单约定

所有表单统一用 react-hook-form + zod，不要手写 touched、错误状态或校验函数。

- **规则只写一份**：接口字段的校验规则写在 `contracts/` 的 zod schema 里。后端用它校验请求，前端表单 schema 复用其中的字段，只在上面加输入形态的转换（如价格元转分、字符串转数字）。不要在前后端各写一遍规则。
- **表单状态**：`useForm({ resolver: zodResolver(schema), mode: "onTouched" })`，字段失焦后开始校验，之后实时更新。
- **字段组件**：用 `@/shared/ui/form-field` 的 `FormTextField`、`FormRadioGroup`，它们绑定 `control` 并展示错误；新的字段类型也加在这里。
- **输入过滤**：只可能非法的字符通过 `sanitize` 在输入时过滤，校验规则仍以 schema 为准。
- **放弃填写不校验**：表单用 `useAbandonGuard`，点遮罩、标题或带 `data-abandon` 的“取消”按钮引起的失焦不触发校验。
- **react-aria 的 `Form` 必须设 `validationBehavior="aria"`**，否则字段无效时浏览器原生校验会拦住提交。
- **服务端错误**：提交函数返回 Promise，失败时 reject；表单内用 `setError` 就地展示（如 SKU 重复标在字段上，通用校验错误用 Alert），其余失败由调用方 toast。
- 参考实现：`src/features/products/product-form-dialog/ProductFormDialog.tsx`。

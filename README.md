# 商户后台前端基座

面向中大型 B 端商户后台的 React SPA：Vite + React + TypeScript、React Router、TanStack Query、React Aria Components、CSS Modules、Koa、Vitest 与 Playwright。

## 本地运行

- Node.js `>=22.12.0`（建议 22.13.0）
- pnpm `11.26.0`

```sh
pnpm install
```

开发时分别在两个终端启动 Koa 和 Vite。Vite 会把 `/api` 代理到 Koa，浏览器使用同源 Cookie。

终端一：

```sh
pnpm dev:backend
```

终端二：

```sh
pnpm dev
```

登录账号为 `admin` / `admin123`（管理员）和 `viewer` / `viewer123`（只读）。演示用户、会话与订单保存在后端进程内存中；重启后端会恢复初始数据。演示凭据不应用于生产环境。

生产部署先运行 `pnpm build`，再用 `pnpm start` 启动 Koa。Koa 在同一端口提供 `apps/web/dist/` 静态资源和 `/api`，并将前端深层路由回退到 SPA 入口。`PORT` 环境变量可更改默认的 3001 端口。

## 容器部署

后端用 esbuild 连同 `@merchant/contracts` 和第三方依赖打成单个 `apps/server/dist/server.js`（`pnpm build` 会同时构建前后端），运行时不需要 `node_modules` 和 tsx。Dockerfile 是多阶段构建，最终镜像只含前后端产物。

```sh
docker build -t merchant-admin .
docker run -p 3001:3001 -e COOKIE_SECURE=false merchant-admin   # 纯 HTTP 演示
docker run -p 3001:3001 -e TRUST_PROXY=true merchant-admin      # HTTPS 反向代理之后
```

| 环境变量        | 作用                                                                          |
| --------------- | ----------------------------------------------------------------------------- |
| `PORT`          | 监听端口，默认 3001                                                           |
| `TRUST_PROXY`   | 设为 `true` 时信任 `X-Forwarded-Proto`，用于 TLS 在反向代理处终止的部署       |
| `COOKIE_SECURE` | 生产环境会话 cookie 默认带 `secure`；纯 HTTP 部署设为 `false`，否则登录会失败 |

不用 Docker 时：`pnpm build` 后执行 `pnpm start:prod`（运行打包产物），或 `pnpm start`（用 tsx 直接跑源码）。

## 常用检查

```sh
pnpm check       # 格式、类型、lint、单测、生产构建
pnpm test:e2e    # Playwright 浏览器流程
pnpm build       # 生产构建
```

Playwright 会自动启动 Koa 和 Vite。首次使用需要安装 Chromium：`pnpm exec playwright install chromium`。

## 目录边界

pnpm workspace，依赖只能朝下：`apps/web`、`apps/server` → `packages/contracts`，应用之间互不依赖（ESLint 强制）。

- `packages/contracts`（`@merchant/contracts`）: 前后端共用的 zod 契约。校验规则、请求与响应类型的唯一来源。
- `apps/web`（`@merchant/web`）: React SPA，`src` 按 FSD 分层。
  - `src/app`: Provider、路由、布局与全局 QueryClient。
  - `src/pages`: 路由页面，只组合 feature 与共享 UI。
  - `src/features`: 按业务域组织 API、Query、组件与类型；跨 feature 只走公开 `index.ts`。
  - `src/shared/api`: 统一请求、凭据策略与错误模型。
  - `src/shared/ui`: 可替换的设计令牌与 React Aria 包装组件。
- `apps/server`（`@merchant/server`）: Koa API、内存演示数据、会话认证和权限校验。
- `tests/e2e`: 登录、订单筛选、详情和状态变更浏览器流程。

## UI 开发

全局设计变量与页面基础样式在应用入口统一加载。新增共享控件、业务样式或设计变量前，请先阅读 [UI 开发约定](docs/ui-guidelines.md)。

服务端数据由 TanStack Query 管理，查询键包含商户和筛选条件；不把远端数据放入全局客户端 store，也不持久化到 localStorage。登录会话指定用户唯一默认商户，前端不提供商户切换器。商户 ID 是路由参数，不是安全边界：每个订单 API 都由 Koa 根据会话校验商户归属和权限。演示服务使用内存 session 和明文演示密码，不应直接作为生产认证方案。

## 后续生产化工作

1. 将演示用户、内存 session 与订单替换为正式身份和持久化存储，并配置 cookie 域、会话续期和退出策略。
2. 将 feature API 的路径、分页/排序参数、错误结构和并发版本字段与正式 API 契约对齐。
3. 生产身份采用 HttpOnly、Secure、合适 SameSite 的会话 Cookie；状态变更请求按部署拓扑实施 CSRF 防护。避免将访问/刷新令牌放入 localStorage/sessionStorage。
4. 后端必须在每个读写请求检查租户归属和资源访问权限，不能信任客户端传入的 `merchantId`、隐藏按钮或权限列表。
5. 上线前完成安全评审、审计日志、限流/重放策略、CSP、错误监控和真实身份环境的端到端验收。

初期保持单应用 SPA，不先引入 SSR、BFF、微前端或 monorepo。只有出现接口聚合、浏览器无法安全持有身份、独立团队/部署等实际需求时，再独立评估 BFF 或拆分策略。

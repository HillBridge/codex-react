# Koa 后端迁移 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 以 Koa 内存演示后端替换 MSW，并改为用户名密码登录及单商户直达工作区。

**Architecture:** `backend/` 承担演示数据、cookie 会话、认证授权和订单 API；Vite 在开发时代理 `/api` 到 Koa，Koa 在生产时提供 API 和 `dist/` 静态资源。前端继续以 `shared/api/request.ts` 为唯一请求入口，session 响应携带唯一商户，路由不再获取或切换商户列表。

**Tech Stack:** Node.js、TypeScript、Koa、@koa/router、koa-bodyparser、koa-static、React、TanStack Query、Vite、Vitest、Playwright。

**Spec:** `docs/superpowers/specs/2026-10-14-koa-backend-design.md`

## Global Constraints

- 后端位于仓库根目录的 `backend/`，数据仅存于进程内，重启后复位。
- API 保持同源 `/api` 路径；不使用 MSW、mock Service Worker 或浏览器请求拦截。
- 成功登录和 `GET /api/session` 均返回 `{ user, merchant }`，每位用户只有一个商户。
- session cookie 必须为 HttpOnly、SameSite=Lax；生产环境启用 Secure。
- 所有错误体必须为 `{ code, message, requestId }`，每个响应携带 `x-request-id`。
- 受保护订单接口必须服务端校验会话商户和权限；前端路由参数及隐藏按钮不是授权依据。
- 演示账号为 `admin` / `admin123` 与 `viewer` / `viewer123`。
- 删除所有 MSW 源码、依赖、配置、worker 文件和测试引用；禁止遗留 `msw` 导入或命令。

## Review Focus

- Cookie 缺失、失效或无效时，`GET /api/session` 与每个订单路由都必须返回统一的 401 错误，而不是泄漏数据。
- 会话用户请求另一个商户的 URL 时，即使订单存在，也必须返回 403。
- `page`、`pageSize`、`status` 和 `q` 的非法或边界值必须产生可预测的筛选/分页结果且不使服务崩溃。
- 只读用户对状态接口的 PATCH 必须在读取或修改订单前被拒绝，且订单版本不变化。
- cookie 在生产环境必须带 Secure，而本地开发联调仍可在 HTTP 下建立会话。

### Task 1: 建立 Koa 运行时与可测服务器工厂

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `backend/src/app.ts`
- Create: `backend/src/server.ts`
- Create: `backend/src/lib/request-id.ts`
- Create: `backend/src/lib/errors.ts`
- Create: `backend/src/app.test.ts`

**Interfaces:**
- Consumes: 当前根包 TypeScript、Vitest 和 Vite 配置。
- Produces: `createApp(options?: { serveStatic?: boolean }): Koa`，以及 `pnpm dev:backend`、`pnpm start` 和让 Vite 将 `/api` 代理至后端的配置。

- [x] **Step 1: 写入 Koa 基础响应的失败测试**

在 `backend/src/app.test.ts` 中以 Node HTTP 测试客户端启动 `createApp()`，断言任意 API 响应含有非空 `x-request-id`，且未知 API 返回 JSON `404` 和 `{ code, message, requestId }`。

- [x] **Step 2: 运行该测试并确认失败**

Run: `pnpm test backend/src/app.test.ts`
Expected: FAIL，因为 `backend/src/app.ts` 尚不存在或未导出 `createApp`。

- [x] **Step 3: 安装并配置 Koa 运行依赖，创建最小应用工厂**

在 `package.json` 加入运行依赖 `koa`、`@koa/router`、`koa-bodyparser`、`koa-static` 及相应 TypeScript 类型；实现 request-id 中间件、未知错误到 JSON 错误的转换、JSON body 解析和 API 404 处理。`backend/src/server.ts` 从环境变量 `PORT`（默认 3001）启动 `createApp({ serveStatic: true })`；Vite 对 `/api` 使用 `http://localhost:3001` 代理；新增 `dev:backend` 和 `start` 脚本。

- [x] **Step 4: 运行基础应用测试并确认通过**

Run: `pnpm test backend/src/app.test.ts`
Expected: PASS，两个响应均带 request ID，未知 API 返回规范错误体。

- [x] **Step 5: 提交该独立运行时变更**

```bash
git add package.json pnpm-lock.yaml vite.config.ts backend/src
git commit -m "feat: add koa api runtime"
```

### Task 2: 实现内存数据、认证与会话 API

**Files:**
- Create: `backend/src/data/demo-data.ts`
- Create: `backend/src/data/store.ts`
- Create: `backend/src/auth/session.ts`
- Create: `backend/src/auth/require-user.ts`
- Create: `backend/src/routes/auth.ts`
- Modify: `backend/src/app.ts`
- Create: `backend/src/routes/auth.test.ts`

**Interfaces:**
- Consumes: `createApp()`、统一错误工具和 request ID 中间件。
- Produces: `POST /api/auth/login`、`POST /api/auth/logout`、`GET /api/session`；`requireUser(ctx)` 返回包含唯一 `merchant` 的当前 session，或抛出 401 API 错误；`resetDemoStore()` 可供每个测试隔离状态。

- [x] **Step 1: 写入登录与 session cookie 的失败测试**

在 `backend/src/routes/auth.test.ts` 中验证：`admin` / `admin123` 登录得到管理员 merchant 与 `Set-Cookie`；携带 cookie 的 `GET /api/session` 返回同一 user/merchant；空字段返回 400；错误密码返回 401；logout 清理 cookie，后续 session 返回 401；测试生产选项下 cookie 包含 `Secure`。

- [x] **Step 2: 运行认证测试并确认失败**

Run: `pnpm test backend/src/routes/auth.test.ts`
Expected: FAIL，因为认证路由及 session 存储尚不存在。

- [x] **Step 3: 实现演示账号、内存 session 与认证路由**

在演示数据中定义用户、明文演示密码、唯一商户和权限。使用随机不透明 session ID 的内存 Map，并将其写入名为 `merchant_session` 的 HttpOnly、SameSite=Lax cookie；依据 `NODE_ENV` 设置 Secure。登录严格验证 `{ username, password }` 字符串，成功响应 `{ user: { id, name }, merchant: { id, name, permissions } }`；logout 永远返回 204 并清理 cookie。

- [x] **Step 4: 运行认证测试并确认通过**

Run: `pnpm test backend/src/routes/auth.test.ts`
Expected: PASS，成功、参数错误、凭据错误、logout 和 cookie 安全属性均符合断言。

- [x] **Step 5: 提交认证功能**

```bash
git add backend/src
git commit -m "feat: add demo session authentication"
```

### Task 3: 实现受保护订单 API 与服务端授权

**Files:**
- Create: `backend/src/routes/orders.ts`
- Modify: `backend/src/data/demo-data.ts`
- Modify: `backend/src/data/store.ts`
- Modify: `backend/src/app.ts`
- Create: `backend/src/routes/orders.test.ts`

**Interfaces:**
- Consumes: `requireUser(ctx)` 返回的 `{ user, merchant }` 与可重置订单 store。
- Produces: `GET /api/merchants/:merchantId/orders`、`GET /api/merchants/:merchantId/orders/:orderId`、`PATCH /api/merchants/:merchantId/orders/:orderId/status`。

- [x] **Step 1: 写入订单 API 的失败测试**

在 `backend/src/routes/orders.test.ts` 建立管理员和只读用户的 cookie，并断言：管理员列表支持 `status=pending&q=OD20261012&page=1&pageSize=1`；无会话为 401；会话商户与 URL 参数不一致为 403；不存在订单为 404；只读 PATCH 为 403 且后续 GET 版本不变；错误 expectedVersion 为 409；管理员仅能将 pending 更新为 confirmed 或 cancelled，成功时版本加一。

- [x] **Step 2: 运行订单 API 测试并确认失败**

Run: `pnpm test backend/src/routes/orders.test.ts`
Expected: FAIL，因为订单路由尚不存在。

- [x] **Step 3: 实现筛选、商户归属和状态更新**

在订单路由的首个受保护操作中将 `ctx.params.merchantId` 与 session merchant ID 比对。规范化筛选参数：空、`all` 或未知 status 不限制状态；页码最小为 1；pageSize 限制为 1–100；`q` 按订单号和 ID 不区分大小写匹配。PATCH 仅允许 `order:update` 权限，并原子检查版本及 `pending → confirmed/cancelled` 转换后更新内存订单。

- [x] **Step 4: 运行订单 API 测试并确认通过**

Run: `pnpm test backend/src/routes/orders.test.ts`
Expected: PASS，认证、商户归属、筛选、权限、版本和状态转换全部通过。

- [x] **Step 5: 提交订单 API**

```bash
git add backend/src
git commit -m "feat: add authorized order api"
```

### Task 4: 重建前端 API 基础设施与登录表单

**Files:**
- Modify: `src/shared/api/request.ts`
- Modify: `src/shared/api/request.test.ts`
- Modify: `src/features/session/api.ts`
- Modify: `src/features/session/types.ts`
- Move: `src/features/session/dev-login-page/DevLoginPage.tsx` to `src/features/session/login-page/LoginPage.tsx`
- Move: `src/features/session/dev-login-page/DevLoginPage.module.css` to `src/features/session/login-page/LoginPage.module.css`
- Move: `src/features/session/dev-login-page/DevLoginPage.test.tsx` to `src/features/session/login-page/LoginPage.test.tsx`
- Replace: `src/features/session/dev-login-page/index.ts` with `src/features/session/login-page/index.ts`
- Modify: `src/features/session/index.ts`
- Modify: `src/pages/LoginPage.tsx`
- Modify: `src/test/setup.ts`

**Interfaces:**
- Consumes: API contract from Task 2 and existing `ApiError`.
- Produces: `login(credentials: { username: string; password: string }): Promise<Session>`，其中 `Session` 含 `user` 与 `merchant`；可访问的 `/login` 表单；不依赖 MSW 的 request 测试设施。

- [x] **Step 1: 写入登录请求与表单交互的失败测试**

将 request 测试改用临时 `globalThis.fetch` 替身，断言 JSON 请求、错误体解析、网络失败和 204 处理。将页面测试改为输入用户名和密码后提交，断言请求收到 `{ username, password }`，成功时 session cache 被写入且导航到 session merchant 路径；空字段不提交并显示字段说明。

- [x] **Step 2: 运行前端 API 与登录测试并确认失败**

Run: `pnpm test src/shared/api/request.test.ts src/features/session/login-page/LoginPage.test.tsx`
Expected: FAIL，因为 `login`、新的 session 类型与表单页面尚不存在。

- [x] **Step 3: 实现类型化登录和表单 UI**

让 `request.ts` 继续为唯一 fetch 入口，设置 JSON accept header、保留 credentials 与 session-expired 事件。用 React Aria 文本输入和密码输入实现登录表单，禁用重复提交，展示服务端错误；成功后清理旧 query cache、缓存 session，并导航到 `/m/${session.merchant.id}`。将开发演示文案、身份按钮和 `/api/dev-login` 全部替换。

- [x] **Step 4: 运行前端 API 与登录测试并确认通过**

Run: `pnpm test src/shared/api/request.test.ts src/features/session/login-page/LoginPage.test.tsx`
Expected: PASS，request 边界和用户名密码流程均通过。

- [x] **Step 5: 提交前端登录变更**

```bash
git add src/shared/api src/features/session src/pages/LoginPage.tsx src/test/setup.ts
git commit -m "feat: add password login flow"
```

### Task 5: 收敛为单商户路由并删除切换器

**Files:**
- Modify: `src/app/routes.tsx`
- Modify: `src/app/AppLayout.tsx`
- Modify: `src/pages/MerchantHomePage.tsx`
- Modify: `src/pages/OrdersPage.tsx`
- Modify: `src/pages/OrderDetailPage.tsx`
- Modify: `src/features/merchant/types.ts`
- Modify: `src/features/merchant/index.ts`
- Delete: `src/features/merchant/api.ts`
- Delete: `src/features/merchant/queries.ts`
- Delete: `src/features/merchant/merchant-switcher/`
- Modify: `src/features/session/session.integration.test.tsx`
- Modify: `src/features/orders/orders.integration.test.tsx`
- Modify: `src/app/App.test.tsx`

**Interfaces:**
- Consumes: `Session.merchant` from Task 4 and existing order feature API/query functions.
- Produces: 以 session merchant 为唯一来源的 `MerchantRouteContext`，登录/根路由直达该商户，且没有商户列表请求或切换 UI。

- [x] **Step 1: 写入单商户路由的失败测试**

将 session integration 测试替换为：已登录 session 访问 `/` 重定向到该 merchant；未登录受保护地址重定向到 `/login`；手动访问不同 merchant ID 时显示无权访问且不发起订单请求。AppLayout 测试断言不存在商户切换按钮，而显示当前商户和登录用户名。

- [x] **Step 2: 运行路由测试并确认失败**

Run: `pnpm test src/features/session/session.integration.test.tsx src/app/App.test.tsx`
Expected: FAIL，因为路由仍请求 merchants 并渲染 MerchantSwitcher。

- [x] **Step 3: 移除商户列表依赖并收敛上下文**

将 `/dev-login` 更换为始终存在的 `/login`。`RootRedirect`、`RequireSession` 和 `MerchantRoute` 都以 `useSession()` 为唯一身份来源；若 URL merchant ID 与 session merchant ID 不同，显示 forbidden。`MerchantRouteContext` 只保留 `merchant`，AppLayout 从 session 显示用户名称，移除全部 MerchantSwitcher 导入、目录和 merchant API/query 导出。

- [x] **Step 4: 运行路由测试并确认通过**

Run: `pnpm test src/features/session/session.integration.test.tsx src/app/App.test.tsx`
Expected: PASS，直达、未登录重定向、越权商户保护和无切换器断言均通过。

- [x] **Step 5: 提交单商户前端改造**

```bash
git add src/app src/features/merchant src/features/session src/pages src/features/orders
git commit -m "refactor: use session scoped merchant"
```

### Task 6: 删除 MSW 并建立真实端到端联调

**Files:**
- Delete: `src/mocks/`
- Delete: `public/mockServiceWorker.js`
- Delete: `dist/mockServiceWorker.js`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `playwright.config.ts`
- Modify: `tests/e2e/merchant-orders.spec.ts`
- Modify: `README.md`
- Modify: `.gitignore` (仅当新增运行时文件需要忽略时)

**Interfaces:**
- Consumes: Tasks 1–5 的 Koa API、Vite 代理与 `/login` 流程。
- Produces: 无 MSW 依赖的仓库，以及自动启动 Koa 和 Vite 的真实 Playwright 联调。

- [x] **Step 1: 写入真实浏览器流程的失败测试**

将 `tests/e2e/merchant-orders.spec.ts` 改为访问 `/login`，输入 `admin` / `admin123`，断言直达东区商户；筛选订单号后打开详情并确认订单，断言状态刷新。增加只读账号无法显示修改按钮的场景。

- [x] **Step 2: 运行 Playwright 测试并确认失败**

Run: `pnpm test:e2e`
Expected: FAIL，因为 Playwright 尚未启动 Koa、旧测试仍访问 `/dev-login` 或 MSW。

- [x] **Step 3: 删除 MSW 并配置真实双服务测试**

移除 `msw` 依赖、package MSW 配置、main 中 worker 启动、测试 setup 中 MSW server、所有 `src/mocks` 和 worker 文件。配置 Playwright webServer 同时启动 Koa 和 Vite，等待两者就绪。更新 README 的运行指令、演示账号、内存数据限制、API/权限行为及生产启动方式。

- [x] **Step 4: 运行端到端测试并确认通过**

Run: `pnpm test:e2e`
Expected: PASS，管理员真实登录、订单筛选/状态修改与只读限制均通过。

- [x] **Step 5: 扫描运行时代码的 MSW 遗留并运行完整质量门禁**

Run: `! rg -n -i "msw|mockServiceWorker|dev-login|MerchantSwitcher" src backend public tests package.json vite.config.ts playwright.config.ts README.md && pnpm check && pnpm test:e2e`
Expected: `rg` 无匹配；格式、样式、类型、lint、单测、构建与端到端测试全部通过。

- [x] **Step 6: 提交清理与联调配置**

```bash
git add -A
git commit -m "chore: replace msw with koa backend"
```

## Final Verification

- [x] 运行 `pnpm check`，确认格式、样式、类型、lint、单测和生产构建全部通过。
- [x] 运行 `pnpm test:e2e`，确认浏览器真实调用 Koa 的登录、订单筛选、详情和状态变更流程通过。
- [x] 运行 `! rg -n -i "msw|mockServiceWorker|dev-login|MerchantSwitcher" src backend public tests package.json vite.config.ts playwright.config.ts README.md`，确认运行时代码、测试、配置和 README 不再引用被删除方案。
- [x] 运行 `git status --short`，确认无意外生成物；检查 `git log --oneline -6`，确认任务提交完整。

# 商户后台前端基座 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立一个可运行、可测试、便于接入真实 API 的商户后台 SPA 基座，并实现订单管理纵向流程。

**Architecture:** Vite + React + TypeScript 单应用；React Router 管页面，TanStack Query 管远端数据，React Aria Components 与项目自有 CSS 令牌构成 UI 层。MSW 仅在开发与测试环境模拟 API；业务页面只依赖 feature API 边界。

**Tech Stack:** React, TypeScript, Vite, React Router, TanStack Query, React Aria Components, MSW, Vitest, Testing Library, Playwright, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-12-merchant-admin-foundation-design.md`

## Global Constraints

- 第一阶段采用单应用 SPA；初始不引入 Express BFF、SSR、微前端或多应用工作区。
- 模拟登录和 MSW 仅在开发与测试环境启用，生产构建不启用。
- UI 使用 React Aria Components 与项目自有 UI 层；样式采用 CSS 变量设计令牌与 CSS Modules。
- 服务端数据由 TanStack Query 管理；查询键包含商户标识与所有影响结果的筛选参数。
- 商户 ID 只是选择参数；真实商户隔离、权限校验和资源归属校验由服务端完成。
- 不持久化服务端数据缓存或长期凭据到浏览器存储。
- feature 之间只通过公开入口交互；`shared` 不依赖业务 feature。

## Review Focus

- 切换商户时旧订单或迟到响应不得显示到新商户页面；Task 4 和 Task 6 覆盖。
- 非法页码与筛选参数必须规范化并保持 URL 状态一致；Task 5 覆盖。
- 用户无权修改订单时隐藏操作入口，直接请求仍由服务端负责拒绝；Task 6 覆盖前端展示，接口契约测试明确后端前提。
- 订单状态已被其他操作修改时，409 必须提示冲突并刷新详情和列表；Task 6 覆盖。
- 401 会话失效必须离开受保护页面并清理会话视图；Task 4 覆盖。

---

## 文件职责图

```text
src/app/                 应用入口、路由、Provider、布局
src/pages/               路由页面
src/features/session/    会话读取与开发环境模拟登录
src/features/merchant/   可访问商户与当前商户切换
src/features/orders/     订单契约、查询、表格、详情、状态更新
src/shared/api/          统一 HTTP 请求与错误模型
src/shared/ui/           项目级 UI 包装组件、令牌
src/mocks/               MSW handlers 与 fixtures
src/test/                Vitest/MSW 测试设置
tests/e2e/               Playwright 关键业务流程
```

## Task 1: 工程骨架与质量门槛

**Files:** `package.json`, `pnpm-lock.yaml`, `index.html`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `.prettierrc.json`, `.gitignore`, `src/main.tsx`, `src/app/App.tsx`, `src/app/App.test.tsx`, `src/test/setup.ts`

**Interfaces:** `App` 导出 React 根组件；脚本提供 `dev`, `build`, `typecheck`, `lint`, `format:check`, `test`, `test:e2e`, `check`。

- [ ] 先写 `App.test.tsx`：断言渲染“商户工作台”主标题。
- [ ] 运行 `pnpm test -- src/app/App.test.tsx`，确认因入口缺失而失败。
- [ ] 初始化 Vite React TypeScript、Vitest、Testing Library、ESLint、Prettier；设置 Node `>=22.12.0`，固定 pnpm `packageManager` 字段。
- [ ] `check` 脚本同时运行 Prettier 校验，覆盖设计文档要求的格式检查。
- [ ] 实现最小 App 和测试环境配置。
- [ ] 运行 `pnpm test -- src/app/App.test.tsx`、`pnpm typecheck`、`pnpm lint`、`pnpm build`；四项退出码均为 0。

## Task 2: 项目 UI 层与路由布局

**Files:** `src/shared/ui/Button.tsx`, `src/shared/ui/Button.module.css`, `src/shared/ui/StatusPanel.tsx`, `src/shared/ui/StatusPanel.module.css`, `src/shared/ui/tokens.css`, `src/app/AppLayout.tsx`, `src/app/routes.tsx`, 对应组件测试。

**Interfaces:** `Button` 基于 React Aria Button 并支持 `variant: 'primary' | 'secondary' | 'danger'`；`StatusPanel` 接收 `kind: 'loading' | 'empty' | 'error' | 'forbidden'`、`title` 和可选重试回调。

- [ ] 先写 Button 键盘触发与状态类名测试、StatusPanel 各状态标题测试。
- [ ] 运行对应 Vitest 文件并确认失败。
- [ ] 定义颜色、间距、字体、圆角、焦点环 CSS 变量；封装上述组件并实现侧栏、顶部栏、内容区布局。
- [ ] 配置 React Router 根布局、404 页和统一错误边界。
- [ ] 运行组件测试与 `pnpm check`，确认通过。

## Task 3: 请求客户端与 MSW

**Files:** `src/shared/api/ApiError.ts`, `src/shared/api/request.ts`, `src/mocks/fixtures.ts`, `src/mocks/handlers.ts`, `src/mocks/browser.ts`, `src/mocks/server.ts`, `public/mockServiceWorker.js`, `src/test/setup.ts`。

**Interfaces:** `apiRequest<T>(path: string, init?: RequestInit): Promise<T>`；`ApiError` 暴露 `status`, `code`, `requestId`；handlers 可模拟 401、403、404、409、429、5xx。

- [ ] 先写 request 单测，断言 JSON 成功解析、HTTP 错误映射 `ApiError`、网络失败保留可识别错误。
- [ ] 运行 request 测试确认失败。
- [ ] 实现 request；统一设置 `credentials: 'same-origin'`，透传 `AbortSignal`，仅对安全的读取请求由调用方控制重试。
- [ ] 创建 MSW 浏览器与 Node 测试 server；只在开发模式动态加载浏览器 worker；未处理的 `/api` 请求报错。
- [ ] 运行 request 测试及 `pnpm check`。

## Task 4: 会话与商户上下文

**Files:** `src/features/session/types.ts`, `src/features/session/api.ts`, `src/features/session/queries.ts`, `src/features/session/index.ts`, `src/features/merchant/types.ts`, `src/features/merchant/api.ts`, `src/features/merchant/queries.ts`, `src/features/merchant/MerchantSwitcher.tsx`, `src/features/merchant/index.ts`, `src/pages/LoginPage.tsx`, `src/pages/MerchantHomePage.tsx`, feature tests。

**Interfaces:** `Session { user: { id: string; name: string } }`; `Merchant { id: string; name: string; permissions: string[] }`; `useSession()`, `useMerchants()`, `MerchantSwitcher` 通过路由导航切换商户。

- [ ] 先写测试：开发模拟登录可进入后台；401 回登录页；切换商户更新 URL 和当前标题；商户权限随商户更新。
- [ ] 运行 feature 测试确认失败。
- [ ] 用 Query 管理 session 与 merchant 请求；实现仅开发环境可见的模拟登录入口、受保护路由与商户切换器。
- [ ] mock fixtures 提供两个商户和只读/可修改订单权限两种角色。
- [ ] 验证开发模式可用、生产构建不包含 MSW 启动及开发登录路由；运行 `pnpm check`。

## Task 5: 订单列表与 URL 查询状态

**Files:** `src/features/orders/types.ts`, `src/features/orders/api.ts`, `src/features/orders/queryKeys.ts`, `src/features/orders/queries.ts`, `src/features/orders/OrderFilters.tsx`, `src/features/orders/OrderTable.tsx`, `src/features/orders/index.ts`, `src/pages/OrdersPage.tsx`, 对应测试。

**Interfaces:** `OrderFilters { status: 'all' | 'pending' | 'confirmed' | 'cancelled'; q: string; page: number; pageSize: number }`; `parseOrderFilters(params: URLSearchParams): OrderFilters`; `orderKeys.list(merchantId, filters)`；`useOrders(merchantId, filters)`。

- [ ] 先写 `parseOrderFilters` 测试：合法参数保留；未知状态回退 `all`；非法/小于 1 的页码回退 1；页大小限制为 20。
- [ ] 先写 query key 测试：商户 ID、状态、搜索词、页码任一变化都产生不同 key。
- [ ] 运行测试确认失败。
- [ ] 实现订单 list API 与 MSW fixtures；用 React Aria Table 显示订单号、时间、金额、状态与详情链接。
- [ ] 筛选和分页同步到 URL；切换商户时新查询只读新商户数据；加载/空/错误状态使用 `StatusPanel`。
- [ ] 运行订单单测、组件测试与 `pnpm check`。

## Task 6: 订单详情、状态更新与隔离回归

**Files:** `src/features/orders/mutations.ts`, `src/features/orders/OrderDetails.tsx`, `src/pages/OrderDetailPage.tsx`, orders handlers/fixtures 与对应测试。

**Interfaces:** `Order { id: string; merchantId: string; number: string; createdAt: string; amount: number; status: 'pending' | 'confirmed' | 'cancelled'; version: number }`; `useOrder(merchantId, orderId)`；`useUpdateOrderStatus()`。

- [ ] 先写测试：无 `order:update` 不渲染状态操作；成功变更后使当前商户订单列表和详情失效；409 显示冲突并触发重取。
- [ ] 写商户切换竞态测试：旧商户请求延迟完成时，页面不得渲染旧商户订单。
- [ ] 运行测试确认失败。
- [ ] 实现详情和状态变更；提交时禁用重复操作，不对变更请求自动重试；成功后失效对应商户 query keys。
- [ ] 运行相关测试与 `pnpm check`。

## Task 7: 端到端验证、CI 与开发文档

**Files:** `playwright.config.ts`, `tests/e2e/merchant-orders.spec.ts`, `.github/workflows/ci.yml`, `.github/pull_request_template.md`, `README.md`。

- [ ] 先写 Playwright 流程断言：模拟登录、选择商户、订单筛选/分页、查看详情、更新状态。
- [ ] 运行 `pnpm test:e2e` 并确认流程失败。
- [ ] 实现浏览器测试配置及必要的稳定 mock；CI 安装锁文件依赖并运行 `pnpm check` 与端到端流程。
- [ ] README 写清 Node/pnpm 要求、启动命令、mock-only 限制、目录边界、接真实后端步骤和上线前授权要求。
- [ ] 最终运行 `pnpm check` 与 `pnpm test:e2e`；确认生产构建不启用 MSW，工作区只包含预期文件。

## 最终验收

- `pnpm dev` 可启动并完成订单端到端流程。
- `pnpm check` 覆盖类型检查、lint、单测和生产构建。
- `pnpm test:e2e` 通过。
- `pnpm build` 产物不启用模拟登录/MSW。
- README 明确此项目是前端基座，生产上线前必须有真实身份系统和后端商户授权。

## 参考资料

- [Vite 环境要求与脚手架](https://vite.dev/guide/)
- [React Router 声明式 SPA 安装](https://reactrouter.com/start/declarative/installation)
- [MSW 浏览器集成](https://mswjs.io/guides/integrations/browser)
- [MSW 3 Node.js 要求](https://mswjs.io/docs/migrations/2.x-to-3.x)

# 商户后台前端基座

面向中大型 B 端商户后台的 React SPA 起点：Vite + React + TypeScript、React Router、TanStack Query、React Aria Components、CSS Modules、MSW、Vitest 与 Playwright。

## 本地运行

- Node.js `>=22.12.0`（建议 22.13.0）
- pnpm `11.26.0`

```sh
pnpm install
pnpm dev
```

开发环境首页会提供管理员/只读演示登录。MSW 模拟会话、商户列表和订单 API；数据仅为内存 fixture，刷新后重置。它不是生产身份认证，也不应被当作真实商户授权。

## 常用检查

```sh
pnpm check       # 格式、类型、lint、单测、生产构建
pnpm test:e2e    # Playwright 浏览器流程
pnpm build       # 生产构建
```

Playwright 首次使用需要安装 Chromium：`pnpm exec playwright install chromium`。

## 目录边界

- `src/app`: Provider、路由、布局与全局 QueryClient。
- `src/pages`: 路由页面，只组合 feature 与共享 UI。
- `src/features`: 按业务域组织 API、Query、组件与类型；跨 feature 只走公开 `index.ts`。
- `src/shared/api`: 统一请求、凭据策略与错误模型。
- `src/shared/ui`: 可替换的设计令牌与 React Aria 包装组件。
- `src/mocks`: 仅用于开发/测试的 MSW handlers 和 fixtures。
- `tests/e2e`: 登录、订单筛选、详情和状态变更浏览器流程。

## UI 开发

全局设计变量与页面基础样式在应用入口统一加载。新增共享控件、业务样式或设计变量前，请先阅读 [UI 开发约定](docs/ui-guidelines.md)。

服务端数据由 TanStack Query 管理，查询键包含商户和筛选条件；不把远端数据放入全局客户端 store，也不持久化到 localStorage。商户 ID 是路由和查询参数，不是安全边界：每个真实 API 都必须由后端依据会话校验用户、商户、资源归属和权限。前端切换商户时依靠路由与 query key 避免展示旧缓存，但这不能替代服务端授权。

## 接入真实后端前

1. 由后端/平台团队确认会话协议、Cookie 域、CSRF 策略、退出与续期行为；当前 `/api/dev-login` 只存在于 MSW 模拟中。
2. 将 feature API 的路径、分页/排序参数、错误结构和并发版本字段与正式 API 契约对齐；删除演示 fixtures，不要直接将 mock handler 当后端实现。
3. 生产身份采用 HttpOnly、Secure、合适 SameSite 的会话 Cookie；状态变更请求按部署拓扑实施 CSRF 防护。避免将访问/刷新令牌放入 localStorage/sessionStorage。
4. 后端必须在每个读写请求检查租户归属和资源访问权限，不能信任客户端传入的 `merchantId`、隐藏按钮或权限列表。
5. 上线前完成安全评审、审计日志、限流/重放策略、CSP、错误监控和真实身份环境的端到端验收。

初期保持单应用 SPA，不先引入 SSR、BFF、微前端或 monorepo。只有出现接口聚合、浏览器无法安全持有身份、独立团队/部署等实际需求时，再独立评估 BFF 或拆分策略。

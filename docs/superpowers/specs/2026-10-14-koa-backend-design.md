# Koa 演示后端与真实 API 接入设计

## 目标

将当前 React 应用从 MSW 浏览器拦截模式迁移至根目录 `backend/` 中运行的 Koa 服务，使前端通过真实 HTTP 请求完成用户名密码登录、会话恢复、订单查询和订单状态更新；登录后直接进入用户的唯一默认商户工作区，不再提供商户切换能力。

## 已确认约束

- 后端使用进程内演示数据，不接入数据库；重启后数据恢复初始状态。
- 登录方式为用户名和密码，使用 HttpOnly 会话 Cookie 保存登录态。
- 每位演示用户只关联一个商户；前端不请求商户列表，也不展示或维护商户切换器。
- 删除所有 MSW 代码、Service Worker、依赖、启动逻辑和只为 MSW 服务的测试基础设施。
- 保留订单列表、筛选、详情、管理员更新订单状态，以及错误、未登录和权限不足的用户体验。

## 运行架构

仓库提供两个明确入口：Vite 负责前端开发体验，Koa 负责 API；生产构建后的静态资源由 Koa 托管。

开发时，Vite 将 `/api` 请求代理到 Koa，因此浏览器始终以同源路径访问 API，Cookie 不需要跨域配置。生产时，Koa 同时提供构建产物和 `/api` 路由，保留相同的请求路径和会话策略。

```text
浏览器 → Vite 开发服务器 → /api 代理 → Koa
浏览器 → Koa（生产静态文件与 /api）
```

后端按职责组织：

- `backend/src/data`：演示账号、商户、订单及其可重置的内存状态。
- `backend/src/auth`：密码校验、session cookie、当前用户解析和权限校验。
- `backend/src/routes`：会话与订单 HTTP 路由；参数验证和响应组装。
- `backend/src/lib`：统一错误响应、请求 ID、状态转换规则等共享服务端能力。

## API 契约

所有错误响应使用 `{ code, message, requestId }`；客户端已有的 `ApiError` 继续解析此结构。

### 认证与会话

| 方法与路径 | 请求 | 成功响应 | 失败行为 |
| --- | --- | --- | --- |
| `POST /api/auth/login` | `{ username, password }` | `{ user: { id, name }, merchant: { id, name, permissions } }` 并写入 HttpOnly Cookie | 400 参数无效；401 凭据错误 |
| `POST /api/auth/logout` | 无 | `204 No Content` 并清除 Cookie | 无会话时同样返回 204 |
| `GET /api/session` | Cookie | 与登录成功响应相同 | 401 未登录或会话失效 |

演示账号固定为 `admin` / `admin123`（管理员）与 `viewer` / `viewer123`（只读）。密码只用于本地演示，不代表生产密码存储方案。

### 订单

订单路由仍携带 `merchantId`，以使页面 URL 和 TanStack Query key 保持商户隔离；服务端必须将该参数与当前会话的唯一商户比对，不能信任前端传入的值。

| 方法与路径 | 功能 | 授权与结果 |
| --- | --- | --- |
| `GET /api/merchants/:merchantId/orders` | 列表与 `status`、`q`、`page`、`pageSize` 筛选 | 已登录且路由商户等于会话商户；返回分页结果 |
| `GET /api/merchants/:merchantId/orders/:orderId` | 订单详情 | 已登录、商户匹配且订单归属匹配；返回订单 |
| `PATCH /api/merchants/:merchantId/orders/:orderId/status` | 更新订单状态 | 仅管理员；校验 `expectedVersion` 和 `pending → confirmed/cancelled` 转换 |

状态不匹配或非法转换返回 409；商户不匹配或非管理员写入返回 403；不存在的订单返回 404。

## 前端改造

`src/shared/api/request.ts` 保持为唯一网络入口，并补足可测试的 API 基础设施：默认 JSON 请求头、明确的 API 基地址配置、空响应处理、统一错误解析和会话失效事件。各 feature 的 `api.ts` 仅暴露与其领域对应的类型化函数。

会话 feature 改为 `LoginPage` 和 `login({ username, password })`。登录成功后写入 session query cache，并跳转到服务器返回商户的 `/m/:merchantId`。根路由及受保护路由只依据 `GET /api/session` 的会话商户决定目标地址；不再调用 `GET /api/merchants`。

`MerchantRouteContext` 收敛为单个 `merchant`。删除 `MerchantSwitcher`、其样式与测试、商户列表 API/query/types，以及所有引用 `merchants` 的页面与路由逻辑。顶部栏可展示当前用户名称和权限标签，但不提供切换入口。

## 错误处理与安全边界

- 每个 API 请求生成或透传 `x-request-id`，错误响应同时包含该值。
- 认证中间件对所有订单接口强制读取服务端 session；前端路由和隐藏按钮不构成授权。
- 未认证响应为 401，前端现有 `app:session-expired` 机制清空 query cache 并回到 `/login`。
- Koa 的异常处理器将未知错误转换为不泄漏内部细节的 500 响应。
- 演示 session 存储在内存中；cookie 设置为 HttpOnly、SameSite=Lax，开发环境不强制 Secure，生产环境强制 Secure。

## 测试与验收

后端以 Vitest 覆盖登录、cookie 会话恢复、商户归属、只读写入拒绝、版本冲突和订单筛选。前端单元/集成测试使用可控的 `fetch` 测试替身或真实 Koa 测试服务器，不使用 MSW。Playwright 在启动 Koa 与 Vite 的真实联调环境中验证用户名密码登录、默认直达工作区、订单筛选和管理员状态更新。

验收时还必须验证：仓库不再包含 `msw` 依赖、`src/mocks`、`public/mockServiceWorker.js` 或任何 MSW 引用；生产构建由 Koa 正确提供；未登录、错误密码、越权商户、只读写入和并发版本冲突均获得预期响应。

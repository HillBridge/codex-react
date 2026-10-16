# 路由说明（src/app/routes.tsx）

[routes.tsx](../src/app/routes.tsx) 做了四件事：定义路由表、登录守卫、根路径分流、会话过期处理。

## 1. 路由表

| 路径                         | 渲染                           | 说明                   |
| ---------------------------- | ------------------------------ | ---------------------- |
| `/login`                     | `LoginPage`                    | 公开页面，不经过守卫   |
| `/`                          | `RootRedirect`                 | 不显示内容，只负责分流 |
| `/workspace`                 | `RequireSession` → `AppLayout` | 受保护区域             |
| `/workspace`（index）        | `WorkspaceHomePage`            | 概览                   |
| `/workspace/orders`          | `OrdersPage`                   | 订单列表，懒加载       |
| `/workspace/orders/:orderId` | `OrderDetailPage`              | 订单详情，懒加载       |
| `/workspace/*`、`*`          | `NotFoundPage`                 | 404                    |

- **嵌套与 Outlet**：`RequireSession` 和 `AppLayout` 都用 `<Outlet />` 标出子路由的渲染位置。切换子页面时，外层的守卫、侧边栏、顶栏保持不动。
- **懒加载**：订单两个页面用 `lazy` 加 `import()`，进入时才下载对应代码，首屏更小。
- **ErrorBoundary**：`/` 和 `/workspace` 挂了 `RouteErrorPage`。页面渲染时抛出未捕获的异常，显示"页面加载失败"，而不是白屏。
- **createAppRoutes()**：路由表包在函数里导出，测试可以用 `createMemoryRouter` 复用同一份路由。全局 `router`（`createBrowserRouter`）由 `App.tsx` 交给 `RouterProvider`。

## 2. 登录守卫：RequireSession

保护 `/workspace` 下所有页面，通过 `useSession()` 判断登录状态：

| session 状态                 | 渲染                                       |
| ---------------------------- | ------------------------------------------ |
| 加载中                       | "正在验证登录状态"                         |
| 401                          | `<Navigate>` 到 `/login`                   |
| 失败且没有数据（后端不可用） | "服务暂时不可用"，带重试按钮               |
| 成功                         | `<Outlet />` 放行，渲染 `AppLayout` 和页面 |
| 已有数据但后台刷新失败       | 继续放行，不拆页面                         |

守卫不放行就不会渲染 `<Outlet />`，子页面的请求在登录确认前不会发出。刷新页面时，订单请求要等 `/api/session` 返回后才发，原因就在这里。

## 3. 根路径分流：RootRedirect

访问 `/` 时查一次 session：

- 已登录：跳 `/workspace`
- 401：跳 `/login`
- 其他错误：显示"服务暂时不可用"和重试按钮

## 4. 会话过期处理

会话过期有两条路径，最终都回到登录页。

**路径 A：事件，覆盖所有接口**

```
任意接口返回 401
  → http.ts 拦截器调用 emitSessionExpired()          （shared/api/sessionExpiry.ts）
  → RequireSession 里的 useSessionExpiry() 收到通知    （features/session/expiry.ts）
  → 清缓存 →（登录过才）弹"登录已过期" → navigate("/login")
```

事件名只在 `sessionExpiry.ts` 里定义一次，请求层只依赖这个小模块，不依赖路由和缓存；过期后的处理规则集中在 `useSessionExpiry` 一个 hook 里。

适用场景：用户已在工作区，session 缓存还在，后端会话实际已过期。点击订单管理时订单接口返回 401，session 查询本身仍是成功状态，只有这条路径能发现。

**路径 B：查询状态，覆盖 session 查询自己的 401**

```
/api/session 返回 401
  → useSession() 变为 isError 且 status 为 401
  → effect 清缓存；渲染 <Navigate replace to="/login" />
```

适用场景：刷新页面时 Cookie 已过期或不存在。`RootRedirect` 在守卫外面，没有注册事件监听，也只能靠这条路径。

**两条路径的重叠**：session 查询返回 401 时两条都会触发，路径 A 先执行。两次都是 `replace` 到同一地址，第二次没有实际效果，无害。

**提示的去重**

- 只有缓存里已有会话（确实登录过）才弹"登录已过期"。首次访问未登录的 401 不提示。
- 多个请求同时 401 时，第一个事件清空缓存后，后面的事件读不到会话，不再提示。
- toast 带固定 `id: "session-expired"`，由 sonner 保证同一 id 同时只存在一条，作为兜底。

## 小结

这个文件把"哪个地址显示什么"和"谁能进入"放在一起：路由表决定页面结构，守卫和根分流决定登录前后的去向，事件监听保证会话过期时统一回到登录页。页面本身的内容和业务数据不在这里处理。

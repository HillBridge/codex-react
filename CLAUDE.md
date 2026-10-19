# 项目约定

## 目录架构：Feature-Sliced Design（FSD）

后续开发统一遵循 FSD。层级自上而下，**只能依赖更低的层**：

`app` → `pages` → `widgets` → `features` → `entities` → `shared`

| 层 | 放什么 | 现状 |
|---|---|---|
| `app` | 入口、路由、全局 Provider、全局样式、`queryClient` | 已有 |
| `pages` | 一个路由一个切片，只做组装，不写业务逻辑 | 已有 |
| `widgets` | 由多个 feature/entity 组成、被多个页面复用的独立界面块 | 已有：`order-summary`、`settlement-summary`、`product-summary`，概览页和对应列表页复用 |
| `features` | 有业务价值的用户操作与其数据（如订单列表、登录） | 已有：`orders`、`products`、`settlements`、`overview`、`session` |
| `entities` | 被多个 feature 共用的业务模型（类型、展示规则），只放确实被两个以上 feature 用到的部分 | 已有：`order` |
| `shared` | 与业务无关的通用能力：`api`、`hooks`、`ui` | 已有 |

规则（已由 `eslint.config.js` 强制，违反则 `pnpm lint` 失败）：

- 下层不能引用上层，例如 `shared` 不能引用 `features`。
- 同一层的切片互不依赖，例如 `features/orders` 不能引用 `features/session`。需要共享时下沉到更低的层。
- 跨切片只能从公共出口引入：`@/features/orders`，不能写 `@/features/orders/api`。切片内部文件之间用相对路径。
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

提交前钩子（`.githooks/pre-commit`）会依次执行 format:check、lint:styles、typecheck、lint、test，失败则不能提交。

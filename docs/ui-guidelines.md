# UI 开发约定

本项目使用 React Aria Components 提供可访问的交互基础，用 CSS Modules 实现项目视觉，不依赖 Ant Design。修改 UI 前先判断样式和组件属于哪一层，再选择相应目录。

## 样式和组件放置

```text
apps/web/src/shared/ui/<component>/       跨业务复用、契约稳定的基础组件
apps/web/src/features/<domain>/<component>/  业务域内可独立维护的组件
apps/web/src/features/<domain>/            API、query、mutation、types、领域测试
apps/web/src/pages                         路由级页面组合和页面专属样式
apps/web/src/shared/ui/tokens.css          全局设计变量
apps/web/src/app/styles/global.css         全局 reset、字体和页面默认样式
```

依赖从基础到页面：tokens / global styles → shared UI → feature UI → pages。页面可以组合下层组件；shared UI 不依赖 feature 或 page。

- 只有在多个 feature 确有相同视觉和行为契约时，才把组件提升到 `shared/ui`。不要为了封装而封装每一个 React Aria 原语。
- 每个独立维护的 UI 组件使用一个 kebab-case 目录；目录内放 PascalCase 的组件文件、对应 CSS Module、组件级测试和 `index.ts` 导出。不要把许多组件的 TSX/CSS/test 平铺在同一目录。
- Feature 的根目录保留业务 API、query/mutation、类型、query key 和 feature 级集成测试；组件则归入各自目录。Feature 根 `index.ts` 负责稳定导出业务组件。
- 共享组件通过少量语义化 props 提供变体和尺寸；调用方不要依赖内部 DOM 结构或内部 CSS Module 类名。
- 跨页面重复的结构（如筛选工具栏、页面标题区、数据表格）可先在 feature 内验证，再在契约稳定后提升复用。
- 页面负责组合业务和共享 UI，不定义全局样式或重复实现基础控件。

## 全局样式与 CSS Modules

- `tokens.css` 只保存 `:root` 下的自定义属性；新增全局字体、reset 或 `html`/`body` 规则时放入 `apps/web/src/app/styles/global.css`。
- 两个全局样式表只在 `apps/web/src/main.tsx` 引入一次。不要在布局组件、路由页面或 feature 中引入全局 CSS。
- 组件/feature 外观放在对应 `.module.css`。禁止用全局 `button`、`table` 等选择器批量覆盖组件外观。
- React Aria 的交互外观使用其状态属性，如 `data-focused`、`data-hovered`、`data-selected`、`data-disabled`；状态规则归属于该组件的 CSS Module。
- 避免 `:global`、ID 选择器、`!important` 和过高特异性。确实无法避免时，在 PR 说明原因及影响范围。

## 设计变量

- 优先复用语义变量，如 `--color-primary`、`--color-text-muted`、`--color-border`、`--color-surface`、`--control-height`、`--radius-control`、`--space-*`。
- 新变量要表达稳定语义，避免为单个页面临时创建与现有变量同义的 token。
- 组件和 feature 样式不要直接写颜色、阴影等共享视觉值；原始色值集中定义在 `tokens.css`。透明、`currentColor` 等必要 CSS 关键字可按 lint 规则使用。
- 当前只维护默认浅色主题。新增暗色或品牌主题时使用根节点主题属性和 CSS 变量，不在组件文件复制第二套样式。
- 商户品牌配置只影响外观；必须校验配置值，不能用于实现权限判断或数据隔离。

## 响应式与 H5

- 断点只有两个：`64rem`（平板/小屏笔记本，侧栏收窄）和 `48rem`（手机）。写法统一为 `@media (max-width: 48rem)`，由 stylelint 的 `media-feature-name-value-allowed-list` 限制，新增断点需先改 `stylelint.config.mjs` 并更新本节。
- 纯样式差异直接写 `@media`；只有需要渲染不同组件或传不同 props 时才用 `useIsMobile()`（`shared/hooks/useMediaQuery`），其断点与 `48rem` 保持一致。
- 手机上列表以卡片展示：`DataTable` 的列用 `isActions` 标记操作列，其余列自动带上列名；筛选栏有搜索框时下拉默认折叠。
- 手机上弹窗（`Dialog`）和下拉选项（`TableFilter`）从底部滑出。表单操作按钮在手机上固定在弹窗底部。
- 页面内容避开刘海和底部横条：`body` 已按 `env(safe-area-inset-*)` 留白，自己定位到屏幕边缘的元素（如底部抽屉）需自行加上。
- 输入框在手机上字号不小于 16px，避免 iOS 聚焦时自动放大页面。
- 抽屉和底部弹层支持滑动关闭：抽屉向左滑、弹层向下滑，用 `useSwipeDismiss`（`shared/hooks`）。新做的手机端弹层应接入它。
- 文字颜色要满足 WCAG AA（对比度 >= 4.5:1）：蓝色文字用 `--color-primary-text`、红色错误文字用 `--color-danger-text`、次要文字用 `--color-text-subtle`；`--color-primary`、`--color-danger` 只用于填充和边框。
- 新增 `transition` 或 `animation` 时，在同一文件里加 `@media (prefers-reduced-motion: reduce)` 将其关闭。

## 交互、可访问性与内容

- 可交互控件必须有清晰的键盘焦点样式；完整支持键盘操作，不移除 React Aria 提供的可访问行为。
- 为表单和操作考虑默认、悬停、按下、聚焦、禁用、错误、加载、选中等相关状态。重要状态不能只靠颜色区分。
- 页面需考虑窄视口、浏览器缩放、长商户名/订单号、空数据和错误信息；避免文本溢出遮挡操作。
- 面向多语言时使用内容驱动布局；不要依赖固定宽度容纳某种语言的特定文案。
- 加载、空数据、错误和无权限反馈优先复用 `StatusPanel`，保证页面状态体验一致。

## UI 变更评审清单

- 是否选择了正确的归属层，是否存在可复用的 shared UI 或业务模式？
- 是否复用已有语义 token；新增 token 是否具有可解释、跨场景的语义？
- 是否定义必要的聚焦、禁用、错误、加载和选中状态？键盘访问是否可用？
- 窄视口、长文本、空数据和失败场景是否仍能理解并操作？
- 是否使用了 `:global`、`!important`、高特异性选择器或第三方内部 DOM 结构？如果有，是否说明理由和范围？
- 共享组件 API 是否清晰，是否避免让调用方依赖其内部样式实现？
- 变更是否影响其他 feature 或路由？是否运行 `pnpm check` 和相关 Playwright 流程？

违反约定确有必要时，在 PR 描述中说明约束、影响范围和后续清理责任，不用 lint disable 静默绕开规则。

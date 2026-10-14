# UI 工程规范与样式基础设计

## 目标

为多人协作的中大型 B 端后台建立轻量、可执行的 UI 工程约定，使共享控件、业务组合和页面样式有清晰边界；让全局主题可在所有路由中稳定加载；并将设计 token 使用和 CSS 质量约束纳入自动检查与代码评审。

本设计延续当前 React Aria Components + CSS Modules，不引入 Ant Design，不全面重写现有页面，也不提前搭建独立 UI 包或完整设计系统平台。

## 当前上下文

- `src/shared/ui/tokens.css` 同时定义 `:root` 设计变量和基础页面规则。
- 该文件由 `src/app/AppLayout.tsx` 引入，而非应用入口；不经该布局的路由存在样式入口依赖不清的问题。
- 当前有 `Button`、`StatusPanel` 两个共享 UI 封装；订单筛选和商户切换直接组合 React Aria Components 并分别用 CSS Modules 定义外观。
- `package.json` 已有格式、TypeScript、ESLint、Vitest、构建检查，但没有 CSS 专项 lint 或样式 token 使用检查。
- 现有组件和 feature 样式中有少量颜色硬编码；最近建立的基础主题样式仍应作为这套规范的实际基线保留。

## 方案

### 1. 全局样式入口与文件职责

- 将 `tokens.css` 收敛为 `:root` 下的设计变量，不在其中放置 `body`、reset 等全局选择器。
- 新增 `src/app/styles/global.css`，放置最小化的 reset、`html`/`body` 基础样式、字体和页面默认值。
- 在 `src/main.tsx` 静态引入 `tokens.css` 与 `global.css`，保证登录页、路由错误页和后台布局共享同一全局基础。
- 主题 token 继续放在 `src/shared/ui/tokens.css`，避免仅为迁移而重命名已有共享路径。

### 2. 样式和组件分层

约定依赖方向：

```text
app/styles + design tokens
            ↓
shared/ui：稳定、跨业务复用的基础 UI
            ↓
feature UI：面向业务的复合模式和业务组件
            ↓
pages：页面组合与路由级状态
```

- `shared/ui` 只收录具有跨 feature 复用价值且视觉/行为契约稳定的组件；不为了封装而封装每一个 React Aria 原语。
- 通用控件通过有限、语义明确的 props 表达视觉差异，例如 `variant`、`size`、`isDisabled`、`isLoading`；调用方不依赖内部 DOM 层次或局部 CSS 类名。
- 多个页面重复出现且拥有共同交互契约的结构（如筛选工具栏、数据表格、页面标题区）可提升为 feature-neutral 模式；业务特有布局继续留在 feature CSS Module。
- `pages` 负责组装 feature 和共享 UI，不承载基础控件实现或全局主题规则。

### 3. CSS Modules 和 React Aria 状态

- 全局 CSS 仅用于 reset、基础页面规则、字体和 token；组件和 feature 样式继续使用 CSS Modules。
- 通过 React Aria 提供的状态属性（例如 `data-focused`、`data-hovered`、`data-selected`、`data-disabled`）表达交互状态；状态样式归属到使用该组件的模块。
- 限制 `:global`、`!important`、ID 选择器和高特异性选择器。不得通过脆弱的 DOM 子代链或第三方组件内部类名作为长期样式 API。
- 所有交互控件需有键盘可见焦点；禁用、错误、加载、选中等状态必须有稳定视觉反馈，不能只依赖颜色差异传达重要状态。

### 4. Token 与主题治理

- 优先使用语义 token，如 `--color-primary`、`--color-text-muted`、`--color-border`、`--color-surface`、`--control-height`、`--radius-control`、`--space-*`。
- 原始色阶可作为 token 的来源，但组件和 feature 样式引用语义 token；新增 token 需要说明适用语义，避免同义重复变量。
- 颜色、表面、边框、阴影等共享视觉属性禁止在组件样式中任意硬编码；允许 `transparent`、`currentColor` 等必要 CSS 关键字，以及纯几何场景的零值。例外需要就近说明原因，不得用 lint disable 避开团队规则。
- 当前交付只提供默认浅色主题。将来如需暗色或品牌主题，通过根节点 `data-theme` / CSS 变量扩展；商户品牌配置必须校验并仅影响外观，不参与权限和租户隔离。

### 5. 自动检查与代码评审

- 增加 Stylelint 到本地 `pnpm check`，对 CSS Modules 与全局 CSS 执行语法和常见质量规则。
- 使用 Stylelint strict-value 插件对颜色及其他共享视觉属性要求 CSS 变量；对 token 定义文件配置有边界的例外。禁止用宽泛文件忽略绕过检查。
- 规则覆盖 `!important`、超高选择器特异性、无效/重复声明等基础问题；配置应先对本仓库现有样式做一次清理，再设为错误级别。
- `docs/ui-guidelines.md` 作为开发者日常查阅的短规范，包含层级、样式归属、token 添加、组件 API、React Aria 状态、例外流程和 PR 检查清单。
- PR UI 检查清单覆盖：是否复用正确层级、是否复用/新增语义 token、键盘和焦点状态、加载/空/错误/禁用态、长文本/窄视口、是否影响其他 feature。
- 继续用现有 Vitest、Playwright 和生产构建验证交互与路由。本阶段不增加 Storybook、视觉快照平台或新的截图基础设施；待共享组件数量和 UI 回归成本足够高时再单独评估。

## 范围和非目标

纳入：全局 CSS 职责拆分和入口调整、UI 约定文档、Stylelint 配置及 `pnpm check` 集成、现有样式为通过 lint 所需的最小修正。

不纳入：更换组件库、重新设计业务页面、将所有 React Aria 使用点包装一遍、全面补建表单/表格设计系统、引入 Storybook 或视觉回归服务、暗色主题、商户自定义品牌主题。

## 验收标准

1. 全局 token 与基础规则在 `main.tsx` 单点加载，登录和主布局路由均可用。
2. `tokens.css` 只承担设计变量；全局元素规则有专属文件。
3. UI 规范足以让新团队成员确定样式归属、共享组件抽象条件和例外审批方式。
4. CSS lint 在 `pnpm check` 中运行；在组件样式中写入未经允许的原始颜色会失败，token 文件中的定义可以通过。
5. 全量格式、类型、ESLint、Vitest、构建和现有 E2E 检查通过；没有改变 React Aria 的业务交互行为。

## 参考资料

- [Stylelint 配置文档](https://stylelint.io/user-guide/configure/)
- [stylelint-declaration-strict-value 插件](https://github.com/AndyOgo/stylelint-declaration-strict-value)

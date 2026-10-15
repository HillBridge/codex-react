# UI Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the approved UI styling conventions concrete through a reliable global style entry, team guidance, and automated CSS linting.

**Architecture:** Keep CSS custom-property tokens in `src/shared/ui/tokens.css`, move reset and document defaults into `src/app/styles/global.css`, and load both from `src/main.tsx`. Add a concise UI guideline and Stylelint-based static checks without changing the React Aria component architecture or adding a component catalog.

**Tech Stack:** React 19, Vite 8, React Aria Components, CSS Modules, Stylelint, Vitest, Playwright, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-14-ui-foundation-design.md`

## Global Constraints

- 本设计延续当前 React Aria Components + CSS Modules，不引入 Ant Design，不全面重写现有页面，也不提前搭建独立 UI 包或完整设计系统平台。
- 全局 CSS 仅用于 reset、基础页面规则、字体和 token；组件和 feature 样式继续使用 CSS Modules。
- `shared/ui` 只收录具有跨 feature 复用价值且视觉/行为契约稳定的组件；不为了封装而封装每一个 React Aria 原语。
- 当前交付只提供默认浅色主题。
- 本阶段不增加 Storybook、视觉快照平台或新的截图基础设施。
- 不改变 React Aria 的业务交互行为。

## Review Focus

- The standalone `/login` route must receive the global tokens and document defaults after imports move out of `AppLayout.tsx`; pin with a Playwright assertion on `--color-primary` and computed body defaults (`min-width: 280px`) in Task 1.
- The token declaration file must remain the allowed home for literal design values while ordinary component styles reject literal colors; pin with a Stylelint run against both files in Task 2.
- CSS Modules selectors, including React Aria `data-*` state selectors, must lint without needing global selector escapes; pin by running Stylelint across all `src/**/*.css` in Task 2.
- Required CSS keywords such as `transparent` and `currentColor` must remain usable without a broad lint disable; pin with a Stylelint stdin probe in Task 2.
- A raw color in a color-bearing shorthand must not bypass token enforcement; pin with a Stylelint stdin probe for `background`/`border` shorthand in Task 2.

---

### Task 1: Separate global styles and publish UI conventions

**Files:**

- Modify: `src/shared/ui/tokens.css` — retain only `:root` design custom properties.
- Create: `src/app/styles/global.css` — contain reset, `html`/`body` defaults, and base font rules moved from `tokens.css`.
- Modify: `src/main.tsx` — import both global styles once at the application entry.
- Create: `docs/ui-guidelines.md` — summarize ownership layers, token rules, CSS Modules/React Aria state styling, shared component boundaries, accessibility, responsive and localization considerations, theme guidance, and PR checklist.
- Modify: `README.md` — link the UI guidelines from the project documentation.
- Modify: `tests/e2e/merchant-orders.spec.ts` — assert global styles are present on `/login`, outside `AppLayout`.

**Interfaces:**

- Consumes: approved design in `docs/superpowers/specs/2026-10-14-ui-foundation-design.md`.
- Produces: global style imports at `src/main.tsx`; a standalone global stylesheet at `src/app/styles/global.css`; contributor guidance at `docs/ui-guidelines.md`.

- [x] **Step 1: Add a browser regression test named `global styles load on standalone login`.** After navigating to `/login`, assert `getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim()` equals `"#1677ff"` and `getComputedStyle(document.body).minWidth` equals `"280px"` (`20rem` at the 14px root font size).
- [x] **Step 2: Run the focused browser test.**

Run: `pnpm test:e2e --grep "global styles load on standalone login"`

Expected: the new assertion passes against current behavior; it protects the style contract while import ownership moves.

- [x] **Step 3: Move global element rules out of `tokens.css` and import both files from `main.tsx`.** Preserve the existing token values and reset behavior exactly; do not leave a stylesheet import in `AppLayout.tsx`.
- [x] **Step 4: Write `docs/ui-guidelines.md` and link it from the README.** Keep it concise and actionable; derive ownership, CSS Modules, token, accessibility, responsive/localization, shared-component, theming, exception, and PR checklist rules from the approved spec.
- [x] **Step 5: Run the focused browser test and full project checks.**

Run: `pnpm test:e2e --grep "global styles load on standalone login"`

Expected: PASS with global tokens/defaults available on `/login`.

Run: `pnpm check && pnpm test:e2e`

Expected: format, typecheck, ESLint, unit tests, production build, and both existing browser flows pass.

- [x] **Step 6: Commit Task 1.** Stage only the files listed in this task.

```bash
git add src/shared/ui/tokens.css src/app/styles/global.css src/main.tsx docs/ui-guidelines.md README.md tests/e2e/merchant-orders.spec.ts
git commit -m "refactor: centralize global UI styles"
```

### Task 2: Enforce UI CSS conventions with Stylelint

**Files:**

- Create: `stylelint.config.mjs` — standard CSS rules, bounded selector specificity, no `!important`, strict token checks, and a narrow exception for `src/shared/ui/tokens.css`.
- Modify: `package.json` — add `lint:styles` and include it in `check`.
- Modify: `pnpm-lock.yaml` — record Stylelint and `stylelint-declaration-strict-value` development dependencies.
- Modify: affected `src/**/*.css` files — migrate raw colors in component/feature styles to semantic variables; preserve intentional literal token definitions.

**Interfaces:**

- Consumes: Task 1's `src/shared/ui/tokens.css` and `docs/ui-guidelines.md`.
- Produces: `pnpm lint:styles` as the canonical CSS lint command; `pnpm check` runs CSS lint before TypeScript, ESLint, tests, and build.

- [x] **Step 1: Add the CSS lint dependencies and configure rules.** Use `stylelint-config-standard` plus `stylelint-declaration-strict-value`; require variables for color properties and color-bearing shorthands with `expandShorthand: true`, allow necessary color keywords and narrowly allow geometry/style values within shorthands, enforce `selector-max-specificity: "0,3,0"`, disallow `!important`, and set the class-name pattern to accept the repository's camelCase CSS Module classes. Exempt only `src/shared/ui/tokens.css` from strict-value enforcement.
- [x] **Step 2: Add `lint:styles` and integrate it into `pnpm check`.** Target `src/**/*.css`; do not include generated output or dependencies.
- [x] **Step 3: Probe the token rule before migrating styles.**

Run: `printf '%s\n' '.probe { color: #123456; }' | pnpm exec stylelint --stdin --stdin-filename src/shared/ui/StylelintProbe.module.css`

Expected: FAIL specifically because a literal component color is disallowed.

Run: `printf '%s\n' '.probe { color: var(--color-primary); }' | pnpm exec stylelint --stdin --stdin-filename src/shared/ui/StylelintProbe.module.css`

Expected: PASS.

- [x] **Step 4: Probe the token exception, state selectors, keywords, and shorthands.** Confirm `tokens.css` passes with literal definitions; CSS Module selectors with `data-focused`/`data-hovered` pass; `transparent` and `currentColor` pass; literal `background: #fff` and `border: 1px solid #ddd` fail. Use `pnpm exec stylelint src/shared/ui/tokens.css` and stdin probes with `--stdin-filename src/shared/ui/StylelintProbe.module.css` for inline cases.
- [x] **Step 5: Migrate existing component and feature styles to semantic tokens and run `pnpm lint:styles`.** Do not rewrite layout values or visual design beyond what the lint rule requires; keep necessary geometric values local to components.
- [x] **Step 6: Run full verification.**

Run: `pnpm check && pnpm test:e2e`

Expected: Stylelint, format, typecheck, ESLint, unit tests, build, and browser tests all pass; build output may retain existing non-blocking bundle-size advisories.

- [x] **Step 7: Commit Task 2.** Stage only the Stylelint config, package/lockfile, and CSS files changed by this task.

```bash
git add -- stylelint.config.mjs package.json pnpm-lock.yaml 'src/**/*.css'
git commit -m "chore: enforce UI css conventions"
```

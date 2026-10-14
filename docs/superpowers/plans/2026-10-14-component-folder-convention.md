# Component Folder Convention Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Group every independently maintained component under `src/shared/ui` and `src/features/*` with its styles and component tests in a dedicated directory, without changing runtime behavior.

**Architecture:** Use lowercase kebab-case component directories with PascalCase component files and local CSS Modules. Preserve feature-root boundaries for API/query/domain modules and workflow tests; keep route pages in `src/pages`, moving page-only styles out of feature CSS.

**Tech Stack:** React 19, TypeScript, React Aria Components, CSS Modules, Stylelint, Vitest, Playwright, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-14-component-folder-convention-design.md`

## Global Constraints

- This is a structural refactor only; rendered behavior and public component contracts must remain unchanged.
- Apply the convention to components under `src/shared/ui` and `src/features/*`.
- Keep feature APIs, query/mutation logic, types, query keys, and feature-level workflow tests at the feature root.
- Keep route-level pages under `src/pages`; page styles belong to their page.
- Do not reorganize `src/app`, `src/pages`, `src/shared/api`, or `src/mocks` beyond adding the page-owned `OrdersPage.module.css` stylesheet.
- Do not change behavior, CSS values, component APIs, test scenarios, or add dependencies.
- Use kebab-case component directory names and PascalCase React component filenames.

## Review Focus

- Any stale imports from pre-migration component paths must fail typecheck/build; run `pnpm check` after each migration task.
- Components must keep their CSS Module bindings after relocation; run Playwright order/session flows after the feature and orders moves.
- The split of `Orders.module.css` must preserve each component's selectors and move pagination to the page; run `pnpm check` and E2E after that split.
- Existing consumers must continue using feature root exports for feature components; verify `src/features/*/index.ts` exports and run typecheck.
- Existing component tests must move with their components and still be discovered; run `pnpm test` after each task.

---

### Task 1: Move shared UI components into component folders

**Files:**

- Create: `src/shared/ui/button/Button.tsx`
- Move: `src/shared/ui/Button.module.css` → `src/shared/ui/button/Button.module.css`
- Move: `src/shared/ui/Button.test.tsx` → `src/shared/ui/button/Button.test.tsx`
- Create: `src/shared/ui/button/index.ts`
- Create: `src/shared/ui/status-panel/StatusPanel.tsx`
- Move: `src/shared/ui/StatusPanel.module.css` → `src/shared/ui/status-panel/StatusPanel.module.css`
- Move: `src/shared/ui/StatusPanel.test.tsx` → `src/shared/ui/status-panel/StatusPanel.test.tsx`
- Create: `src/shared/ui/status-panel/index.ts`
- Modify: all current imports of `Button` and `StatusPanel` under `src`
- Modify: `docs/ui-guidelines.md` — document component-folder naming and colocated files

**Interfaces:**

- Consumes: the component-folder naming convention in the spec.
- Produces: shared UI import paths `src/shared/ui/button` and `src/shared/ui/status-panel`; each folder's `index.ts` exports its component.

- [x] **Step 1: Move Button and StatusPanel implementation, CSS, and tests into their component folders.** Keep CSS import paths local and update each moved test to import its component from `./Button` or `./StatusPanel`.
- [x] **Step 2: Add component-local exports and update consumers.** Export `Button` from `button/index.ts` and `StatusPanel` from `status-panel/index.ts`; update all imports in `src/app`, `src/features`, and `src/pages` to the new directories. Inside `StatusPanel`, import Button through `../button`.
- [x] **Step 3: Document the folder convention.** Update `docs/ui-guidelines.md` with kebab-case component directories, PascalCase implementation files, colocated styles/tests, and local `index.ts` exports.
- [x] **Step 4: Run shared UI tests and project checks.**

Run: `pnpm exec vitest run src/shared/ui/button/Button.test.tsx src/shared/ui/status-panel/StatusPanel.test.tsx`

Expected: both component test files pass.

Run: `pnpm check`

Expected: formatting, Stylelint, typecheck, ESLint, all unit tests, and production build pass.

- [x] **Step 5: Commit Task 1.** Stage only shared UI moves, affected imports, and the guideline update.

```bash
git add -- src/shared/ui/Button.tsx src/shared/ui/Button.module.css src/shared/ui/Button.test.tsx src/shared/ui/button src/shared/ui/StatusPanel.tsx src/shared/ui/StatusPanel.module.css src/shared/ui/StatusPanel.test.tsx src/shared/ui/status-panel src/app/AppLayout.tsx src/app/routes.tsx src/features/session/DevLoginPage.tsx src/features/orders/OrderDetails.tsx src/pages/OrderDetailPage.tsx src/pages/OrdersPage.tsx docs/ui-guidelines.md
git commit -m "refactor: group shared UI component files"
```

### Task 2: Move merchant and session components into feature component folders

**Files:**

- Move: `src/features/merchant/MerchantSwitcher.tsx` → `src/features/merchant/merchant-switcher/MerchantSwitcher.tsx`
- Move: `src/features/merchant/MerchantSwitcher.module.css` → `src/features/merchant/merchant-switcher/MerchantSwitcher.module.css`
- Create: `src/features/merchant/merchant-switcher/index.ts`
- Create: `src/features/merchant/merchant-switcher/MerchantSwitcher.test.tsx`
- Move: `src/features/session/DevLoginPage.tsx` → `src/features/session/dev-login-page/DevLoginPage.tsx`
- Move: `src/features/session/DevLoginPage.module.css` → `src/features/session/dev-login-page/DevLoginPage.module.css`
- Create: `src/features/session/dev-login-page/index.ts`
- Create: `src/features/session/dev-login-page/DevLoginPage.test.tsx`
- Modify: `src/features/merchant/index.ts`, `src/features/session/index.ts`

**Interfaces:**

- Consumes: shared UI imports from Task 1; domain types/API/query modules remain at each feature root.
- Produces: existing feature-root exports remain stable (`MerchantSwitcher`, `DevLoginPage`).

- [x] **Step 1: Add component behavior tests at the target locations.** `MerchantSwitcher.test.tsx` verifies selecting another merchant navigates to that merchant's route; `DevLoginPage.test.tsx` verifies the development login heading and both role buttons render with real router/query providers.

Run: `pnpm exec vitest run src/features/merchant/merchant-switcher/MerchantSwitcher.test.tsx src/features/session/dev-login-page/DevLoginPage.test.tsx`

Expected: FAIL because the new component module paths do not exist yet.

- [x] **Step 2: Move both feature components and styles.** Keep each component's imports pointed at feature-root API/query/types modules and the new shared UI directories.
- [x] **Step 3: Add local component exports and preserve feature exports.** Add `index.ts` files and update the merchant/session feature barrels to export from the new locations; do not change consumers of `src/features/merchant` or `src/features/session`.
- [x] **Step 4: Run focused component tests and project checks.**

Run: `pnpm exec vitest run src/features/merchant/merchant-switcher/MerchantSwitcher.test.tsx src/features/session/dev-login-page/DevLoginPage.test.tsx src/features/session/session.integration.test.tsx`

Expected: both component tests and session flow tests pass.

Run: `pnpm check`

Expected: all project checks pass with no imports to the old component paths.

- [x] **Step 5: Commit Task 2.**

```bash
git add -- src/features/merchant/MerchantSwitcher.tsx src/features/merchant/MerchantSwitcher.module.css src/features/merchant/merchant-switcher src/features/merchant/index.ts src/features/session/DevLoginPage.tsx src/features/session/DevLoginPage.module.css src/features/session/dev-login-page src/features/session/index.ts
git commit -m "refactor: group merchant and session components"
```

### Task 3: Split orders component styles and group each component

**Files:**

- Move: `src/features/orders/OrderFilters.tsx` → `src/features/orders/order-filters/OrderFilters.tsx`
- Create: `src/features/orders/order-filters/OrderFilters.module.css` and `index.ts`
- Create: `src/features/orders/order-filters/OrderFilters.test.tsx`
- Move: `src/features/orders/OrderTable.tsx` → `src/features/orders/order-table/OrderTable.tsx`
- Create: `src/features/orders/order-table/OrderTable.module.css` and `index.ts`
- Create: `src/features/orders/order-table/OrderTable.test.tsx`
- Move: `src/features/orders/OrderDetails.tsx` → `src/features/orders/order-details/OrderDetails.tsx`
- Create: `src/features/orders/order-details/OrderDetails.module.css` and `index.ts`
- Create: `src/features/orders/order-details/OrderDetails.test.tsx`
- Delete: `src/features/orders/Orders.module.css` after moving its declarations to their owners
- Create: `src/pages/OrdersPage.module.css` for `.pagination`
- Modify: `src/features/orders/index.ts`, `src/pages/OrdersPage.tsx`

**Interfaces:**

- Consumes: shared UI component directories and feature-root domain modules.
- Produces: stable exports from `src/features/orders`; each component imports only its own CSS Module; `OrdersPage` owns pagination styling.

- [x] **Step 1: Split styles by their current owner without changing declarations.** Move filters/search/select/popover classes to `OrderFilters.module.css`, table classes to `OrderTable.module.css`, detail/actions classes to `OrderDetails.module.css`, and pagination to `src/pages/OrdersPage.module.css`.
- [x] **Step 2: Add component behavior tests in the target directories.** Verify OrderFilters renders search/filter controls, OrderTable renders a labeled grid and supplied order, and OrderDetails renders order information and permitted mutation buttons.

Run: `pnpm exec vitest run src/features/orders/order-filters/OrderFilters.test.tsx src/features/orders/order-table/OrderTable.test.tsx src/features/orders/order-details/OrderDetails.test.tsx`

Expected: FAIL because the new component module paths do not exist yet.

- [x] **Step 3: Move the three component files and update local imports.** Update relative imports to feature-root modules (`types`, `mutations`, shared UI) and import each new local stylesheet.
- [x] **Step 4: Add component and feature exports.** Add component `index.ts` files and update `src/features/orders/index.ts` to preserve current named exports.
- [x] **Step 5: Run focused component tests, order integration tests, and project checks.**

Run: `pnpm exec vitest run src/features/orders/order-filters/OrderFilters.test.tsx src/features/orders/order-table/OrderTable.test.tsx src/features/orders/order-details/OrderDetails.test.tsx src/features/orders/orders.test.ts src/features/orders/orders.integration.test.tsx`

Expected: order domain and workflow tests pass.

Run: `pnpm check && pnpm test:e2e`

Expected: all checks and all browser tests pass; visual CSS declarations remain unchanged apart from file ownership.

- [x] **Step 6: Commit Task 3.**

```bash
git add -- src/features/orders/OrderFilters.tsx src/features/orders/Orders.module.css src/features/orders/order-filters src/features/orders/OrderTable.tsx src/features/orders/order-table src/features/orders/OrderDetails.tsx src/features/orders/order-details src/features/orders/index.ts src/pages/OrdersPage.tsx src/pages/OrdersPage.module.css
git commit -m "refactor: group order feature components"
```

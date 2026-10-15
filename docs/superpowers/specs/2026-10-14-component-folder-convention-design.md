# Component Folder Convention Design

## Goal

Make reusable UI and feature-owned component code easier to scan and maintain by grouping each component's implementation, styles, and component-level tests in a dedicated directory. This is a structural refactor only; rendered behavior and public component contracts must remain unchanged.

## Scope

- Apply the convention to components under `src/shared/ui` and `src/features/*`.
- Keep tokens and global styles at their existing ownership boundaries.
- Keep feature APIs, query/mutation logic, types, query keys, and feature-level workflow tests at the feature root unless they are specifically component-owned.
- Keep route-level pages under `src/pages`; page styles belong to their page, not a feature component stylesheet.
- Do not reorganize `src/app`, `src/pages`, `src/shared/api`, or `src/mocks` as part of this change.
- Do not change behavior, CSS values, component APIs, test scenarios, or add dependencies.

## Directory Convention

Use lowercase kebab-case component directory names and keep the exported React component file in PascalCase:

```text
src/shared/ui/
├── button/
│   ├── Button.tsx
│   ├── Button.module.css
│   ├── Button.test.tsx
│   └── index.ts
├── status-panel/
│   ├── StatusPanel.tsx
│   ├── StatusPanel.module.css
│   ├── StatusPanel.test.tsx
│   └── index.ts
└── tokens.css

src/features/orders/
├── order-filters/
│   ├── OrderFilters.tsx
│   ├── OrderFilters.module.css
│   └── index.ts
├── order-table/
│   ├── OrderTable.tsx
│   ├── OrderTable.module.css
│   └── index.ts
├── order-details/
│   ├── OrderDetails.tsx
│   ├── OrderDetails.module.css
│   └── index.ts
├── api.ts
├── queries.ts
├── mutations.ts
├── queryKeys.ts
├── types.ts
├── orders.test.ts
└── orders.integration.test.tsx
```

The same component-folder pattern applies to `MerchantSwitcher` in its owning feature. A component-local `index.ts` exports the component and its public types only when present. Feature root `index.ts` files remain the public boundary for feature-owned components; `shared/ui` consumers import from each component directory. Do not add an extra `components/` level solely to group these folders.

## Style and Test Ownership

- Each component owns its CSS Module. Do not make one feature stylesheet the implicit styling API for several components.
- Move page-only styles, such as order-list pagination, into the corresponding page stylesheet under `src/pages`.
- Component-specific tests stay alongside the component. Feature-level integration tests and domain logic tests stay at the feature root.
- `tokens.css` remains at `src/shared/ui/tokens.css`; global styles remain under `src/app/styles` and are not component-owned.

## Migration Notes

- Preserve component names, props, exports available through existing feature barrels, React Aria behavior, and rendered markup.
- Update all imports after file moves; prefer feature barrels for cross-feature imports and component-local exports for shared UI.
- Split the current `Orders.module.css` by ownership without changing visual declarations: component selectors move with their components; pagination moves to `OrdersPage` styles.
- Relocate the existing shared UI tests with their components.
- No empty category folders, generic wrappers, or new abstraction layers are introduced.

## Verification

- TypeScript and ESLint resolve all updated imports.
- Unit and integration tests pass unchanged in intent.
- Stylelint and Prettier pass after file moves.
- Production build and Playwright flows pass.
- Git diff review confirms only paths/imports and style ownership changed, with no unrelated working-tree changes included.

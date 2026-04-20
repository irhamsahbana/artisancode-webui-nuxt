# Coding Conventions

## Naming

- **Files & Folders**: `kebab-case` for directories and file names (e.g., `user-profile.vue`).
- **Component Tags**: `PascalCase` when used in templates (e.g., `<UserProfileCard />`).
- **Composables**: `useXxx` prefix (e.g., `useAuth`, `useCart`).
- **Variables/Functions**: `camelCase`.
- **Types/Interfaces**: `PascalCase` (e.g., `UserProfile`).

## Vue & Nuxt Patterns

- **Script Setup**: Prefer `<script setup lang="ts">`.
- **Auto Imports**: Use Nuxt auto-imports for composables and utilities.
- **Props & Emits**: Define `defineProps` and `defineEmits` explicitly.
- **Runtime Config**: Use `useRuntimeConfig()` for environment-based values.
- **API Calls**: Prefer `useApi().apiFetch(...)` over direct `$fetch` calls in pages/components.
- **Page Structure**: Keep `app/pages/` thin and move feature logic into `app/modules/` when the page is non-trivial.
- **Local Types**: Add small local response types when they improve safety and readability instead of falling back to `any`.
- **Async Route UX**: Prefer non-blocking page rendering for client-fetched pages. Do not make route entry wait on data unless the page is unusable without it.
- **useAsyncData**: Avoid `await useAsyncData(...)` in route wrappers, shared page shells, and `ResourceList`-style primitives when the goal is ordinary in-page data loading.
- **Refresh UX**: Keep the last successful dataset visible during refresh when possible, and pair it with inline progress rather than swapping the whole page back to a blank loading state.

## Error Handling

- Prefer local UI handling for predictable user flows:
  - `useBanner().show(...)`
  - inline validation state
  - disabled/loading states
- Reserve Nuxt error helpers for route-level failures or unrecoverable app states.
- Avoid throwing generic `Error` for expected UI validation cases.

## Styling

- Prefer Tailwind utilities first.
- Use shared/global CSS only for app-wide primitives such as theme tokens, resets, or cross-cutting styles.
- Add scoped styles only when utility classes are not enough or when a third-party integration requires it.

## Vue Template Rules

- Follow `vue/max-attributes-per-line` eslint rule:
  - ✅ Place **each attribute on its own new line** when there are multiple attributes
  - ✅ Do not put multiple attributes on the same line
  - ✅ Always break to new line after 1 attribute for component tags

  ✅ Correct:

  ```vue
  <TreeView
    :items="orgTree"
    :level="1"
    @click="handleClick"
  />
  ```

  ❌ Wrong:

  ```vue
  <TreeView :items="orgTree" :level="1" @click="handleClick" />
  ```

## Shared UI Patterns

- Reuse `ResourceList` and `ResourceTable` for CRUD-style resources unless the feature clearly needs a custom layout.
- Reuse `SearchableSelect` for flat option lists and `SearchableTreeSelect` for hierarchical org-unit style selection.
- When a route needs a detail/manage experience, prefer a separate page if the feature is large and a modal if it is lightweight.
- For shared list and dashboard shells, use skeletons that resemble the final layout so navigation feels immediate and content swaps without large layout shift.

## SSR And Client Rendering

- Be careful with browser-only APIs, floating menus, and client-only data fetching.
- If a component fetches only on the client, make SSR/client rendering expectations explicit.
- After changing shared rendering primitives, always check the browser console for hydration warnings.

## Quality Checks

- ✅ Always check for eslint warnings after making changes
- ✅ Fix all warnings before declaring completion
- ✅ Run `pnpm typecheck` (or `pnpm exec nuxi typecheck`) before finishing a TypeScript-heavy task
- ✅ Run `pnpm lint` to verify before finishing a task
- ✅ Smoke test the affected route in the browser for shared component changes
- ✅ Never ignore or leave eslint warnings

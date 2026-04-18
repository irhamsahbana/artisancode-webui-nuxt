# Web UI Agent Guide

## Core Expectations

- Be objective and truthful, even if it may be difficult to hear.
- When editing files, always use absolute paths.
- When making changes to a file, explain why the change is being made.
- When generating code, add comments in English.

## Shell And Commands

- Use `fish` (preferred) or `bash` for shell commands.
- Use `pnpm` for package management.
- Common commands:
  - `pnpm dev`
  - `pnpm build`
  - `pnpm preview`
  - `pnpm lint`
  - `pnpm exec nuxi typecheck`

## Stack And Structure

- Primary stack: Nuxt 4, Vue 3, TypeScript, Tailwind CSS.
- Use the Nuxt `app/` directory for pages, components, composables, middleware, assets, and modules.
- Place feature logic under `app/modules/`.
- Keep `app/pages/` as thin route wrappers whenever possible.
- Centralize shared types under `app/types/` when they are reused across features.
- The `~` alias points to the `app/` root. Avoid `~/app/...`.
- Prefer `~` imports over deep relative imports inside `app/`.

## UI System

- Use the existing shadcn-style component patterns with Tailwind utilities.
- Reuse components under `app/components/` before creating new ones.
- Keep shared class composition in `app/utils/utils.ts` via `cn` when class merging is needed.
- Prefer utility-first styling. Add scoped CSS only when Tailwind utilities are not enough.

## Component Registration

- Nuxt config uses `pathPrefix: false`.
- Always use the filename only as the PascalCase component tag.
- Examples:
  - `app/components/ui/button.vue` -> `<Button>`
  - `app/components/ui/input.vue` -> `<Input>`
  - `app/components/ui/searchable-select.vue` -> `<SearchableSelect>`
  - `app/components/searchable-tree-select.vue` -> `<SearchableTreeSelect>`
  - `app/components/resource/resource-list.vue` -> `<ResourceList>`

## Resource Page Patterns

- Standard list page:
  - module file: `app/modules/resources/{resource-name}/{resource-name}-page.vue`
  - route wrapper: `app/pages/resources/{resource-name}.vue`
- The repo also uses explicit detail/manage pages when needed:
  - `app/pages/resources/companies/[id].vue` -> `companies-manage-page.vue`
  - `app/pages/resources/org-units/[id].vue` -> `org-unit-detail-page.vue`
  - `app/pages/resources/students/[id].vue` -> `student-detail-page.vue`
- Prefer matching the existing pattern for the feature you are editing rather than forcing everything into one template.

## Data And API Patterns

- Use `useApi().apiFetch(...)` for app API calls.
- Frontend calls the Nuxt proxy under `server/api/proxy/[...path].ts`, not the backend directly.
- `useAuth` handles token storage and login/logout.
- `useBanner` is the standard user-facing feedback mechanism for success and error messages.
- `ResourceList` is client-fetched and is suitable for common CRUD-style resource pages.
- Multi-language already exists. Read `docs/localization.md` before changing locale behavior, translated UI copy, or request language headers.
- UI locale source of truth is `app/composables/useLocale.ts`.
- Persist locale changes through `useLocale().setLocale(...)` so cookie `ac_locale` stays in sync.
- `useApi` already sends `Accept-Language` to backend. Do not reimplement language headers per feature.
- For app-level copy, use `useLocale().t(...)`. For raw UI/library labels still stored as plain strings, use `app/utils/ui-localization.ts`.

## Reusable Components

- `SearchableSelect`: searchable flat dropdown for `{ value, label }` options.
- `SearchableTreeSelect`: searchable hierarchical selector for tree-shaped items with `parent_id`.
- `ResourceList`: shared list shell with search, pagination, selection, and delete flow.
- `ResourceTable`: table rendering with row actions and selection support.

## Verification Checklist

- After meaningful UI changes, run the smallest relevant checks first.
- Default verification order:
  1. `pnpm exec nuxi typecheck`
  2. `pnpm lint`
  3. browser smoke test for the affected route
- If a page uses client-only fetching or interactive overlays, explicitly check for:
  - hydration warnings
  - console errors
  - loading, empty, and error states

## Documentation Maintenance

- The AI agent is authorized to update `docs/` files to keep them accurate.
- The AI agent is authorized to update `agents.md` when workflow expectations, coding conventions, or agent instructions need to stay aligned with the implementation.
- When documentation is updated, explicitly mention it in the final response.
- If codebase patterns drift from the docs, proactively update the relevant documentation instead of leaving it stale.
- When a task changes how future frontend work should be executed, documented, or reviewed, update the relevant `agents.md` and `docs/` files in the same task when practical.

# User Preferences

- Be objective and truthful, even if it may be difficult to hear.
- When editing files, always use absolute paths.
- When making changes to a file, explain why the change is being made.
- When generating code, add comments in English.
- **Shell & Package Manager**:
  - Use `fish` (preferred) or `bash` for shell commands.
  - Use `pnpm` for package management (installing dependencies).
  - **Running the App**: Use `pnpm dev` for local development, `pnpm build` for production builds, and `pnpm preview` for local previews.
- **UI System**:
  - Use shadcn/ui patterns with Tailwind CSS utilities.
  - Reuse components under `app/components/` before creating new ones.
  - Keep shared classnames in `app/utils/utils.ts` via the `cn` helper.
- **Tech Stack**:
  - Nuxt 4 + Vue 3 + TypeScript + Tailwind CSS are the primary UI stack.
  - Prefer existing utilities/composables over adding new dependencies.
- **App Structure**:
  - Use the Nuxt 4 `app/` directory for pages, components, composables, middleware, assets, and modules.
  - Place feature logic under `app/modules/` and keep `app/pages/` as thin route wrappers.
  - Centralize shared `.types.ts` under `app/types/`.
  - The `~` alias points to the `app/` root; avoid `~/app/...` to prevent double paths.
  - Prefer `~` alias imports over `../` relative imports inside `app/` to avoid deep relative paths.
- **Component Auto-Registration**:
  - Nuxt config uses `pathPrefix: false` for components, meaning the directory prefix is **not** included in the component name.
  - `app/components/ui/searchable-select.vue` → `<SearchableSelect>` (NOT `<UiSearchableSelect>`)
  - `app/components/ui/button.vue` → `<Button>`
  - `app/components/searchable-tree-select.vue` → `<SearchableTreeSelect>`
  - `app/components/resource/resource-list.vue` → `<ResourceList>`
  - Always use the **filename only** (PascalCase) as the component tag.
- **Module Page Pattern**:
  - Each resource page follows: `app/modules/resources/{resource-name}/{resource-name}-page.vue`
  - Route file is a thin wrapper: `app/pages/resources/{resource-name}.vue`
  - Example: `app/modules/resources/employees/employees-page.vue` + `app/pages/resources/employees.vue`
- **Reusable Components**:
  - `SearchableSelect` — searchable flat dropdown for simple key-value options
  - `SearchableTreeSelect` — searchable hierarchical tree dropdown (for org units with `parent_id`)
  - `ResourceList` — generic CRUD list with pagination, search, and delete support
- **Composables**:
  - `useApi` — wrapper for API calls with auth token (`apiFetch`)
  - `useAuth` — authentication state and login/logout
  - `useBanner` — toast-style notification banner (`show`, `hide`)
- **Documentation Maintenance**:
  - The AI agent is authorized to update `docs/` files to keep them accurate.
  - **Protocol**:
    1. **Inform**: When making documentation changes, explicitly mention them in the final response.
    2. **Suggest**: If the AI detects that the codebase patterns (e.g., new folder structure, new library) deviate from the existing docs, it must proactively suggest updating the relevant documentation file.

# Quick Summary

- **Framework**: Nuxt 4 (Vue 3)
- **UI**: shadcn/ui + Tailwind CSS
- **Component Registration**: `pathPrefix: false` — use filename as tag name (e.g., `<SearchableSelect>`)
- **Module Pattern**: Feature logic in `app/modules/`, thin route wrappers in `app/pages/`
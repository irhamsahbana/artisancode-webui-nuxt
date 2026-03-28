# Architecture

The web UI uses **Nuxt 4** with Vue 3 and the standard Nuxt directory structure.
Project root: `webui/`

## Key Directories

1. **app/**: Nuxt app entry (e.g., `app.vue`), layouts, and app-level UI.
2. **app/pages/**: File-based routing. Each `.vue` file becomes a route.
3. **app/modules/**: Feature module pages (business logic per resource).
4. **app/components/**: Reusable UI components.
   - `app/components/ui/` — Base UI components (Button, Input, Label, SearchableSelect, etc.)
   - `app/components/resource/` — Shared resource components (ResourceList)
   - `app/components/searchable-tree-select.vue` — Tree dropdown component
5. **app/composables/**: Reusable composition functions (`useApi`, `useAuth`, `useBanner`).
6. **app/middleware/**: Route middleware for auth/guards.
7. **app/assets/**: Uncompiled assets (CSS, images used by CSS).
8. **app/layouts/**: Layout components (`default.vue` with sidebar navigation).
9. **public/**: Static files served as-is.
10. **server/**: Nitro server routes and utilities.

## Path Aliases

- `~` maps to the `app/` root for this project.
- Use `~/assets/...` for assets under `app/assets/`.
- Use `~/composables/...` for composables under `app/composables/`.
- Avoid `~/app/...` to prevent double `app/` paths.

## Component Auto-Registration

Nuxt config uses `pathPrefix: false`, meaning the directory prefix is **not** included in the component name. Always use the **filename only** (PascalCase) as the component tag:

| File | Tag Name |
|------|----------|
| `components/ui/button.vue` | `<Button>` |
| `components/ui/input.vue` | `<Input>` |
| `components/ui/label.vue` | `<Label>` |
| `components/ui/searchable-select.vue` | `<SearchableSelect>` |
| `components/searchable-tree-select.vue` | `<SearchableTreeSelect>` |
| `components/resource/resource-list.vue` | `<ResourceList>` |
| `components/auth-menu.vue` | `<AuthMenu>` |

## Module Page Pattern

Most resource pages follow a consistent pattern:

- **Feature module**: `app/modules/resources/{resource-name}/{resource-name}-page.vue`
- **Route file** (thin wrapper): `app/pages/resources/{resource-name}.vue`

Some features also use explicit detail/manage pages when the CRUD flow is too large for a single list page:

- `app/pages/resources/companies/[id].vue` -> `app/modules/resources/companies/companies-manage-page.vue`
- `app/pages/resources/org-units/[id].vue` -> `app/modules/resources/org-units/org-unit-detail-page.vue`
- `app/pages/resources/students/[id].vue` -> `app/modules/resources/students/student-detail-page.vue`

### Current Resource Pages

| Resource | Route | Module File |
|----------|-------|-------------|
| Dashboard | `/` | `modules/dashboard/...` |
| Attendance Logs | `/resources/attendance-logs` | `modules/resources/attendance-logs/attendance-logs-page.vue` |
| Users | `/resources/users` | `modules/resources/users/users-page.vue` |
| Companies | `/resources/companies` | `modules/resources/companies/companies-page.vue` |
| Company Manage | `/resources/companies/:id` | `modules/resources/companies/companies-manage-page.vue` |
| Employees | `/resources/employees` | `modules/resources/employees/employees-page.vue` |
| Job Positions | `/resources/job-positions` | `modules/resources/job-positions/job-positions-page.vue` |
| Org Units | `/resources/org-units` | `modules/resources/org-units/org-units-page.vue` |
| Org Unit Detail | `/resources/org-units/:id` | `modules/resources/org-units/org-unit-detail-page.vue` |
| Work Locations | `/resources/work-locations` | `modules/resources/work-locations/work-locations-page.vue` |
| Work Shifts | `/resources/work-shifts` | `modules/resources/work-shifts/work-shifts-page.vue` |
| Roles | `/resources/roles` | `modules/resources/roles/roles-page.vue` |
| Students Detail | `/resources/students/:id` | `modules/resources/students/student-detail-page.vue` |

## Reusable Components

### SearchableSelect
Flat searchable dropdown for simple key-value options.
- **Props**: `modelValue`, `options` (array of `{ value, label }`), `placeholder`, `searchPlaceholder`, `disabled`
- **Usage**: For Job Positions, Work Locations, Work Shifts, Status fields

### SearchableTreeSelect
Hierarchical searchable tree dropdown for items with `parent_id`.
- **Props**: `modelValue`, `items` (array of `{ id, name, parent_id }`), `placeholder`, `searchPlaceholder`, `disabled`
- **Usage**: For Org Units (tree structure with parent-child relationships)
- **Features**: Indented tree display, search with ancestor preservation, clear button

### ResourceList
Generic CRUD list with pagination, search, and delete support.
- **Props**: `title`, `endpoint`, `columns`, `loadingVariant`, `deleteLabelFormatter`, `canViewDetail`
- **Slots**: `header-actions`, `row-actions`
- **Behavior**:
  - Uses `useApi().apiFetch(...)`
  - Fetches data client-side
  - Supports page-based detail navigation when no `detail` slot is provided
  - Supports modal-style detail flow when a `detail` slot is provided

### ResourceTable
Shared table renderer used by `ResourceList`.
- Handles row selection
- Handles row action menu placement
- Supports built-in `Manage` and `Delete` actions plus custom row action slots

## API Proxy Pattern

The frontend does not call the backend base URL directly from page components.

- App code calls `useApi().apiFetch(...)`
- `useApi` targets `/api/proxy/...`
- Nitro forwards requests through `server/api/proxy/[...path].ts`
- Runtime config key: `apiBase`

This proxy centralizes:
- auth header forwarding
- backend base URL switching by environment
- network error normalization

## Rendering Notes

- Many resource pages fetch on the client and should be checked for hydration safety after UI changes.
- When changing shared list/table primitives, verify:
  - SSR/client markup consistency
  - console warnings
  - empty and loading states

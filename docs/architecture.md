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
- **Slots**: `filters`, `header-actions`, `row-actions`, `detail`
- **Behavior**:
  - Uses `useApi().apiFetch(...)`
  - Fetches data client-side
  - Supports page-based detail navigation when no `detail` slot is provided
  - Supports modal-style detail flow when a `detail` slot is provided

#### ResourceList Slot Guidance

- Keep the built-in search input as the light global finder for the page.
- Use the `filters` slot for full-width filter surfaces:
  - primary filters
  - quick presets
  - active filter chips
  - small supporting summaries tied to the current query state
- Use `header-actions` for async CTAs and status callouts such as export, refresh, sync, or queue summaries.
- Prefer one strong CTA surface over multiple detached buttons when the page has export or background-job actions.
- When custom slot content introduces explicit light-theme colors or gradients, add paired `dark:` styles at the same time so text, badges, and helper copy preserve accessible contrast in dark mode.
- Shared shell surfaces such as the default layout header, sidebar, and dashboard summary cards should maintain obvious surface separation in both light and dark themes; avoid styles that read like plain page background blocks.
- For resource modules, prefer evolving shared primitives (`ResourceList`, `ResourceTable`, layout shell) so pages keep a coherent visual language instead of each module inventing its own styling rules.

### FormDialogShell
Shared modal shell for resource create/edit flows.
- Use for legacy CRUD modals that still open in-page instead of routing to dedicated detail pages.
- Provides a consistent overlay, header, close affordance, scroll handling, and footer rhythm across modules.
- Prefer updating old resource forms to this shell instead of restyling each modal inline.

### ResourceTable
Shared table renderer used by `ResourceList`.
- Handles row selection
- Handles row action menu placement
- Supports built-in `Manage` and `Delete` actions plus custom row action slots
- On mobile, switches to stacked cards instead of forcing dense table scanning
- Keep custom `row-actions` slot content usable as full-width tap targets on small screens

### Mobile Shell Notes
- The default layout mobile navigation should read as an opaque sheet, not a translucent overlay over page content.
- App-shell footer/auth surfaces should stay pinned visually and remain readable above safe-area insets.
- When a resource page relies on `ResourceList`/`ResourceTable`, verify the small-screen card layout before adding feature-local mobile overrides.

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

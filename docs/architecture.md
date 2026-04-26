# Architecture

The Web UI runs on **Nuxt 4**, **Vue 3**, **TypeScript**, and **Tailwind CSS**.
Project root: `webui/`

## Active Directory Structure

Currently active directories:

1. `app/`
   - Nuxt app entry and main UI shell
2. `app/pages/`
   - thin file-based route wrappers
3. `app/modules/`
   - larger page and resource implementations
4. `app/components/`
   - shared UI primitives and reusable shells
5. `app/composables/`
   - shared app logic such as API, auth, banner, and locale helpers
6. `app/layouts/`
   - main app shell, including sidebar and top bar
7. `app/middleware/`
   - global auth guard
8. `app/types/`
   - shared types for API and page modules
9. `app/utils/`
   - presentational helpers, UI localization helpers, and date/time formatters
10. `server/`
   - Nitro proxy layer

`server/` is currently used mainly for the backend proxy:

- `server/api/proxy/[...path].ts`

## Runtime Highlights

- Nuxt config uses `components: [{ path: '~/components', pathPrefix: false }]`.
- Alias `~` points to the `app/` root.
- Global CSS is loaded through `~/assets/css/main.css`.
- Color mode is handled by `@nuxtjs/color-mode`.
- Public runtime config currently includes `appName`.
- Backend access from app code goes through the `/api/proxy/...` proxy.

## Auth Route Map

Current public auth routes:

- `/login`
- `/register`
- `/auth/check-email`
- `/auth/email-verification`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/app/internal/login`

Tenant-aware public auth payload contracts:

- `/login` sends `email`, `password`, and `tenant_code`.
- `/register` sends `tenant_code` as the new tenant code.
- `/auth/check-email` keeps `email` and `tenant_code` in the query so resend verification keeps tenant context.
- `/auth/forgot-password` and resend verification send `email` plus `tenant_code`.

Active route wrapper files:

- `app/pages/login.vue`
- `app/pages/internal/login.vue`
- `app/pages/register.vue`
- `app/pages/auth/check-email.vue`
- `app/pages/auth/email-verification.vue`
- `app/pages/auth/forgot-password.vue`
- `app/pages/auth/reset-password.vue`

Active auth modules:

- `app/modules/auth/login-page.vue`
- `app/modules/auth/internal-login-page.vue`
- `app/modules/auth/register-page.vue`
- `app/modules/auth/check-email-page.vue`
- `app/modules/auth/email-verification-page.vue`
- `app/modules/auth/forgot-password-page.vue`
- `app/modules/auth/reset-password-page.vue`

The auth middleware keeps the public route allowlist in `app/middleware/auth.global.ts`. Update this file when adding a new public auth page.

## Dashboard Pattern

The authenticated app dashboard route currently uses `/app` so `/` can be reserved for marketing pages:

- route wrapper: `app/pages/index.vue`
- module page: `app/modules/dashboard/index-page.vue`

Older references to `dashboard-page.vue` are no longer accurate.

## Resource Route Patterns

The frontend currently uses several resource route patterns side by side. For implementation details and list defaults, use `docs/resource_patterns.md` as the source of truth.

### 1. Thin wrapper to module page

Examples:

- `app/pages/resources/attendance-logs.vue` -> `app/modules/resources/attendance-logs/attendance-logs-page.vue`
- `app/pages/resources/employees.vue` -> `app/modules/resources/employees/employees-page.vue`
- `app/pages/resources/work-shifts.vue` -> `app/modules/resources/work-shifts/work-shifts-page.vue`

### 2. Thin wrapper with an optional route param in the same file

Use this when one module owns its list/manage flow through a route such as `:id?`.

Examples:

- `app/pages/resources/users.vue` -> path `/app/resources/users/:id?`
- `app/pages/resources/roles.vue` -> path `/app/resources/roles/:id?`
- `app/pages/resources/categories.vue` -> path `/app/resources/categories/:id?`
- `app/pages/resources/teachers.vue` -> path `/app/resources/teachers/:id?`
- `app/pages/resources/programs.vue` -> path `/app/resources/programs/:id?`
- `app/pages/resources/enrollments.vue` -> path `/app/resources/enrollments/:id?`
- `app/pages/resources/invoices.vue` -> path `/app/resources/invoices/:id?`
- `app/pages/resources/permissions.vue` -> path `/app/resources/permissions/:id?`

Notes:

- The `permissions` route currently redirects to `/app/resources/roles`.

### 3. Dedicated detail/manage page

Use this when the detail page is intentionally separate.

Examples:

- `app/pages/resources/companies/[id].vue` -> `app/modules/resources/companies/companies-manage-page.vue`
- `app/pages/resources/org-units/[id].vue` -> `app/modules/resources/org-units/org-unit-detail-page.vue`
- `app/pages/resources/students/[id].vue` -> `app/modules/resources/students/student-detail-page.vue`

## Current Resource Modules

Resource modules currently active in the repository:

- attendance logs
- branches
- categories
- companies
- employees
- enrollments
- internal products
- invoices
- job positions
- org units
- permissions
- programs
- roles
- students
- teachers
- users
- work locations
- work shifts

## Internal Commerce Route Map

Internal commerce is an internal-admin feature, not a tenant-admin/owner workflow. Route files stay thin:

- `/app/internal/quotations` -> `app/modules/internal-commerce/admin/internal-commerce-list-page.vue`
- `/app/internal/orders` -> `app/modules/internal-commerce/admin/internal-commerce-list-page.vue`
- `/app/internal/invoices` -> `app/modules/internal-commerce/admin/internal-commerce-list-page.vue`

Shared commerce list helpers live in `app/modules/internal-commerce/`.

Important notes:

- Client admin routes live under `/app/resources/*`.
- Internal admin routes live under `/app/internal/*`, including `/app/internal/login`, `/app/internal/users`, `/app/internal/clients`, `/app/internal/products`, `/app/internal/quotations`, `/app/internal/orders`, and `/app/internal/invoices`. These flows use a separate internal auth token flow.
- Internal auth detection should match `/app/internal` exactly or `/app/internal/*`.

## App Shell Notes

The default app shell is in `app/layouts/default.vue`.

The shell currently handles:

- page title and document title
- sidebar navigation desktop
- mobile navigation drawer
- theme toggle
- locale switcher
- global banner rendering

The active sidebar intentionally exposes only a subset of core resources:

- dashboard
- companies
- employees
- attendance logs
- internal products
- job positions
- work locations
- work shifts
- roles

The `users` resource route still exists for internal/admin flows, but it is intentionally hidden from the main navigation. Current product language favors domain terms such as employee, company, and access/roles over a generic user menu.

Not every page or resource in the repository should automatically appear in the main navigation.

## Reusable Components

Foundational shared UI components:

- `ResourceList`
- `ResourceTable`
- `FormDialogShell`
- `SearchableSelect`
- `SearchableTreeSelect`
- `LocationMapPicker`
- `ui/*` primitives such as `Button`, `Input`, `Card`, `Badge`, and `Table`

`ResourceList` and `ResourceTable` are the main shared shells for many CRUD-style resources. Use `docs/resource_patterns.md` for when and how to apply them.

## Data Flow

Current frontend data flow:

1. The page/module calls `useApi().apiFetch(...)`.
2. `useApi` adds auth headers and `Accept-Language`.
3. The request goes to `/api/proxy/...`.
4. The Nitro proxy forwards the request to backend `runtimeConfig.apiBase`.
5. The page/module consumes the backend response.

For resource pages, the dominant fetch pattern is non-blocking client-side fetch, often paired with storing the last successful result so existing content can remain visible during refresh.

## Date And Time Formatting

API dates and times generally stay as ISO `string` values in the data layer. Format them before displaying them to users through:

- `app/composables/useDateTime.ts` in Vue components
- `app/utils/date-time.ts` for pure helpers or shared formatters

Use `docs/ui_system.md` as the source of truth for user-facing date/time readability rules.

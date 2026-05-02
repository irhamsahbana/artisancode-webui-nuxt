# Architecture

This document captures the frontend structure that is stable enough to matter for future work.

## Route Families

- `/` renders the marketing or landing experience.
- `/app` is the authenticated tenant-admin shell.
- `/app/resources/*` contains tenant-admin resource flows.
- `/app/internal/*` contains internal-admin flows with a separate auth path.
- `/login`, `/register`, and `/auth/*` contain public auth flows.

If you add a public route, update the allowlist in `app/middleware/auth.global.ts`.

## Module Boundaries

- `app/pages/` should stay as thin route wrappers.
- `app/modules/` owns feature behavior, page composition, and feature-local helpers.
- `app/components/` holds shared primitives, reusable shells, and layout components.
- `app/layouts/default.vue` is the main authenticated shell.
- `app/composables/` holds app-level concerns such as auth, locale, API transport, and banners.
- `app/utils/` holds pure formatting and helper logic.
- `server/api/proxy/[...path].ts` is the only backend transport boundary for frontend app code.

## Current Feature Shape

Auth modules live under `app/modules/auth/`.

Dashboard lives under:

- `app/pages/app/index.vue`
- `app/modules/dashboard/index-page.vue`

Resource work is split between tenant-admin and internal-admin areas:

- tenant-admin route wrappers live under `app/pages/resources/`
- tenant-admin feature modules live under `app/modules/resources/`
- internal-admin route wrappers live under `app/pages/internal/`
- internal-admin feature modules live under `app/modules/internal-commerce/` and `app/modules/resources/internal-*`

The repository currently uses more than one resource route shape. Use `docs/resource_patterns.md` instead of forcing every feature into a single template.

## Shared Foundations

The main reusable building blocks today are:

- `ResourceList`
- `ResourceTable`
- `FormDialogShell`
- `Select`
- `SearchableSelect`
- `SearchableTreeSelect`
- `ui/*` primitives
- `InternalResourceFilterPanel`
- `InternalResourceListControls`

The default sidebar intentionally exposes only part of the available modules. A route existing in the repo does not mean it belongs in navigation.

## Data Flow

Frontend modules should follow this path:

1. Call `useApi().apiFetch(...)`.
2. Let `useApi()` add auth and `Accept-Language`.
3. Send requests through `/api/proxy/...`.
4. Let Nitro proxy the request to `runtimeConfig.apiBase`.

For user-facing screens, prefer non-blocking fetch patterns that keep the shell visible and preserve previous content during refresh when that improves orientation.

## Date And Time

- Keep API datetime fields as `string` until a feature has a local reason to convert them.
- Format UI-facing values with `useDateTime()` or `app/utils/date-time.ts`.
- Do not expose raw ISO timestamps in user-facing screens.

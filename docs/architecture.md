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
- Segmented route families should keep matching module segmentation so feature code stays near the route area that owns it.
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
- `app/modules/crm/crm-dashboard-page.vue` for CRM-mode tenants

Resource work is split between tenant-admin and internal-admin areas:

- tenant-admin route wrappers live under `app/pages/resources/crm/`, `app/pages/resources/hr/`, and `app/pages/resources/shared/`
- tenant-admin feature modules live under matching areas in `app/modules/resources/crm/`, `app/modules/resources/hr/`, and `app/modules/resources/shared/`
- internal-admin route wrappers live under `app/pages/internal/`, with resource wrappers grouped in `app/pages/internal/resources/`
- internal-admin feature modules live under `app/modules/internal/resources/`, including the internal commerce resource flows

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

## Product Access

Tenant-admin routes now support multi-product tenant access through:

- `primary_product` for the default post-login experience
- `enabled_products` for the list of products the tenant may access

Current expected values are `hr` and `crm`.

Current product-mode foundations live in:

- `app/utils/product-mode.ts`
- `app/composables/useProductMode.ts`
- `app/composables/useProductConfig.ts`

When adding tenant-admin routes or modules:

1. decide whether the feature belongs to `hr`, `crm`, or both
2. update product navigation through `useProductConfig.ts`
3. update route allowlists or blocks in `app/utils/product-mode.ts`
4. keep `/app/internal/*` outside tenant product-mode logic unless the internal console itself starts supporting product separation

CRM master data currently uses the shared backend `/categories` resource with separate route surfaces in the frontend such as:

- `/app/resources/customer-types`
- `/app/resources/segments`
- `/app/resources/areas`
- `/app/resources/relationship-statuses`

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

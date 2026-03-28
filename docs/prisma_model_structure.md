# Shared Type Structure Guidelines

This document replaces the old Prisma-oriented naming and focuses on the type patterns actually used in the web UI.

## Status

- Prisma is not currently used in `webui/`.
- Treat this document as guidance for shared frontend DTOs and view-model types.

## File Location

- Keep reusable shared types in `app/types/`.
- Keep feature-local types close to the feature when they are not reused elsewhere.
- Avoid creating global types for one-off page-only response shapes.

## Naming

- **Types / Interfaces**: `PascalCase`
- **Feature-local response shapes**: use descriptive names such as `CompanyConfig`, `OrgUnitDetail`, `AttendanceLog`
- **Composable return types**: only extract when reuse or readability justifies it

## Data Shape Guidelines

- Match frontend DTOs to the API contract actually returned by the backend proxy.
- Prefer explicit nullable fields over `any`.
- Use `string` for API datetimes unless the value is intentionally converted to a `Date` object in a narrow local scope.
- When the backend shape is uncertain or partially loaded, narrow with local types before accessing fields directly.

## Practical Rules

- Shared API response wrappers live in `app/types/api.ts`.
- Add new shared transport types there only when multiple features use them.
- For feature-specific responses, define a small local type near the component or composable first.

## Example

```ts
type OrgUnitDetail = {
  name?: string
  category?: string
  parent_id?: string | null
}
```

# Data Model Structure Guidelines

This document outlines conventions for defining shared UI data models and DTOs in the web UI.

## File Location
- Keep shared types in a single directory such as `types/` or `app/types/`.
- Prefer grouping by domain (e.g., `types/user.ts`, `types/order.ts`).

## General Conventions

### Naming
- **Types/Interfaces**: `PascalCase` (e.g., `UserProfile`).
- **Enums**: `PascalCase` with clear value names (e.g., `UserStatus.Active`).
- **DTOs**: Suffix with `Dto` when representing transport shapes.

### Data Shape
- Align DTO shapes with the API contract.
- Normalize dates to ISO strings or consistent `Date` usage across the app.
- Avoid `any`; use explicit nullable fields (`field?: type` or `field: type | null`).

## Example Type

```ts
export interface UserProfileDto {
  id: string
  email: string
  firstName: string
  lastName: string
  createdAt: string
}
```

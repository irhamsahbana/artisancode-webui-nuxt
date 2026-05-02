# Web UI

Nuxt 4 + Vue 3 frontend for the ArtisanCode admin web application.

## Docs

- [Frontend Reference](./docs/frontend-reference.md)
- [Architecture](./docs/architecture.md)
- [Localization](./docs/localization.md)
- [Resource Patterns](./docs/resource_patterns.md)
- [Testing And Verification](./docs/testing-and-verification.md)

## Setup

Make sure to install dependencies:

```bash
pnpm install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

## Production

Build the application for production:

```bash
pnpm build
```

Locally preview production build:

```bash
pnpm preview
```

## Verification

```bash
pnpm typecheck
pnpm lint
```

## Public Auth Routes

- `/login`
- `/register`
- `/auth/check-email`
- `/auth/email-verification`
- `/auth/forgot-password`
- `/auth/reset-password`

## App Data Flow

- app code calls `useApi().apiFetch(...)`
- requests go through Nitro proxy at `server/api/proxy/[...path].ts`
- proxy forwards requests to `runtimeConfig.apiBase`

## Resource Route Notes

Resource pages currently use a mix of:

- thin route wrappers to module pages
- optional-id routes like `/resources/roles/:id?`
- dedicated detail pages like `/resources/companies/[id]`

See [Architecture](./docs/architecture.md) for the current route families and module boundaries.

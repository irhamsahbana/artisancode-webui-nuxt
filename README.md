# Web UI

Nuxt 4 + Vue 3 frontend for the ArtisanCode admin web application.

## Docs

- [Architecture](./docs/architecture.md)
- [Coding Conventions](./docs/coding_conventions.md)
- [Development Workflow](./docs/development_workflow.md)
- [Localization](./docs/localization.md)
- [Tech Stack](./docs/tech_stack.md)

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

See [Architecture](./docs/architecture.md) for the current route map and module inventory.

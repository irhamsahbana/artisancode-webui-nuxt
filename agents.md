# Web UI Agent Guide

This file is the entry point for work in `webui/`. Keep it lean. Put durable detail in `docs/`.

## Read Before Editing

- `docs/frontend-reference.md` for stack, structure, coding rules, and shared frontend expectations.
- `docs/architecture.md` for route families, module boundaries, and app data flow.
- `docs/resource_patterns.md` when changing CRUD-style or internal-admin resource screens.
- `docs/localization.md` before changing translated copy, locale routing, or language headers.
- `docs/testing-and-verification.md` before running browser checks or changing verification expectations.

## Working Rules

- Before using Serena for `webui`, activate the Serena project at `webui/`. Do not use Serena against the umbrella workspace for frontend tasks.
- Stay within the current Nuxt 4, Vue 3 Composition API, TypeScript, and Tailwind patterns already used in the repo.
- Keep `app/pages/` thin. Put non-trivial feature code in `app/modules/`.
- Use `useApi().apiFetch(...)` for app API calls through the Nuxt proxy.
- Use keyed localization through `useLocale().t(...)` or `useLocale().format(...)`. Do not add raw-string fallback maps.
- Use `useDateTime()` or `app/utils/date-time.ts` for user-facing dates and times.
- Prefer focused verification first, then `pnpm typecheck`, then `pnpm lint`.
- Add or update focused tests when helper, composable, or shared UI behavior changes.
- When frontend docs or this file change, rerun `pnpm test:unit`.
- Use backend seed data in `../artisancode-backend-go/db/seeds/data/` when local frontend testing needs credentials.
- Never commit unless the user explicitly asks.

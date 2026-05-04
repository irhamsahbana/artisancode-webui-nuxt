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
- Prefer the `pnpm` workflows documented in `docs/frontend-reference.md` and `docs/testing-and-verification.md`. Keep this file focused on routing and durable agent rules.
- Stay within the current Nuxt 4, Vue 3 Composition API, TypeScript, and Tailwind patterns already used in the repo.
- Keep `app/pages/` thin. Put non-trivial feature code in `app/modules/`.
- Use `useApi().apiFetch(...)` for app API calls through the Nuxt proxy.
- Use keyed localization through `useLocale().t(...)` or `useLocale().format(...)`. Do not add raw-string fallback maps.
- Use `useDateTime()` or `app/utils/date-time.ts` for user-facing dates and times.
- Follow the verification order and command details in `docs/testing-and-verification.md` instead of duplicating them here.
- Add or update focused tests when helper, composable, or shared UI behavior changes.
- Use backend seed data in `../artisancode-backend-go/db/seeds/data/` when local frontend testing needs credentials.
- After local frontend testing, stop any dev server or browser-support process started for the task, especially `pnpm dev` on ports such as `3055`; verify the port is no longer listening when practical.
- Never commit unless the user explicitly asks.

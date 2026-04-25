# Web UI Agent Guide

This file is the short entry point for work in `webui/`.

## Must Read Before Editing

- `docs/agent-operating-guide.md` for shell usage, command expectations, and documentation maintenance.
- `docs/coding_conventions.md` for Vue, Nuxt, TypeScript, styling, and template rules.
- `docs/architecture.md` for active routes, modules, data flow, and app shell context.
- `docs/ui_system.md` for shared UI expectations and date/time readability rules.
- `docs/resource_patterns.md` when changing CRUD-style resource pages.
- `docs/development_workflow.md` for implementation and verification flow.
- `docs/localization.md` before changing locale behavior, translated copy, or language headers.
- `docs/playwright_testing.md` before browser, Playwright, route, or responsive smoke testing.

## Non-Negotiables

- Use Nuxt 4, Vue 3 Composition API, TypeScript, and Tailwind CSS patterns already present in the repo.
- Keep `app/pages/` thin and put non-trivial feature work under `app/modules/`.
- Use `useApi().apiFetch(...)` for app API calls; frontend code talks to the backend through the Nuxt proxy.
- Use `useLocale().t(...)` or `useLocale().text(...)` for app copy.
- Use `useDateTime()` or `app/utils/date-time.ts` helpers for dates shown to users. Do not expose raw ISO timestamps in UI.
- Keep agent-facing documentation in English unless a user explicitly asks for another language.
- Run the smallest meaningful verification first, normally `pnpm typecheck` then `pnpm lint`.
- Use `docs/playwright_testing.md` for local route checks, browser screenshots, Browser/Playwright MCP fallback behavior, and dev-server cleanup.
- When helper behavior changes, add or update focused unit tests and run `pnpm test:unit`.
- When `agents.md` or related workflow/docs files change, rerun `pnpm test:unit` in addition to the usual verification so documentation-backed expectations stay enforced.
- When local frontend testing needs login credentials, use the backend seed CSV data in `/Users/codebeast/Documents/src/artisancode/artisancode-backend-go/db/seeds/data/`, especially `users.csv`.
- Never commit to git unless the user explicitly asks.

## Quick Context

- Component auto-registration uses `pathPrefix: false`, so use filename-based PascalCase tags such as `<Button>` and `<ResourceList>`.
- The `~` alias points to `app/`; avoid `~/app/...`.
- Active shared UI foundations include `ResourceList`, `ResourceTable`, `FormDialogShell`, `SearchableSelect`, `SearchableTreeSelect`, and `ui/*` primitives.
- The default sidebar intentionally exposes only a subset of resource modules.

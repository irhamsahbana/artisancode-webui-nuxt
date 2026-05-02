# Development Workflow

1. **Define UI Needs**:
   - Identify route (`app/pages/`) or component (`app/components/`) changes.
   - Determine shared logic for `app/composables/`.

2. **Implement UI**:
   - Build or update Vue components.
   - Keep state local when possible; move reusable logic into composables.
   - Keep route wrappers thin; for CRUD-style resources, prefer a page shell that wires feature-local helpers, composables, and dialog components instead of holding all logic inline.
   - When working on shared primitives or layout building blocks, add or update colocated Histoire stories under `app/components/ui/` or `app/components/layout/` so visual states stay easy to review in isolation.

3. **Wire Data**:
   - Use `useApi().apiFetch(...)` for app API calls.
   - Use `useAsyncData` only when it matches the existing feature pattern and does not block route entry unnecessarily.
   - Prefer non-blocking client fetch for list pages, dashboards, and similar screens where the shell can render before the data returns.
   - Centralize reusable transport types in `app/types/` when needed.

4. **Add Routing & Middleware**:
   - Create or update files in `app/pages/`.
   - Add route middleware in `app/middleware/` when needed.
   - When adding public auth pages, update the guest/public route allowlist in `app/middleware/auth.global.ts`.

5. **Validate UX**:
   - Confirm loading, empty, and error states.
   - Confirm navigation enters the page immediately even on slower network conditions.
   - Keep old content visible during refresh when it helps preserve orientation.
   - Confirm dates and times are readable for non-technical users, not raw API timestamps.
   - Ensure client/server rendering behaves as expected.
   - Check browser console for hydration warnings and runtime errors.
   - Verify success and error banners when form submission is involved.
   - For auth email flows, verify `Retry-After` handling, resend cooldown, and redirect behavior between register, check-email, verify-email, forgot-password, and reset-password pages.

## Resource Guidance

Use `docs/resource_patterns.md` as the source of truth for CRUD-style resources, route patterns, shared shells, filters, actions, and list defaults.

For resource refactors, prefer this split when the page starts to grow:

1. page shell for route wiring and slot composition
2. feature-local composable for async state and submit flows
3. feature-local pure helper for payload, label, or query shaping
4. focused tests beside the feature for both helper and composable contracts

## Verification Defaults

After meaningful changes, run:

1. the smallest relevant focused test first, such as `pnpm exec vitest run --config vitest.config.ts <suite>` or `node --test <file>`
2. `pnpm typecheck` or `pnpm exec nuxi typecheck`
3. `pnpm lint`
4. `pnpm test:unit` when helper logic, shared utilities, or workflow/agent docs changed
5. route-level browser smoke test when route or interactive UI behavior changed
6. `pnpm histoire:build` when you add or change shared Histoire stories or their supporting config

Use `docs/playwright_testing.md` for the browser smoke-test workflow, including local dev server startup, route checks, desktop/mobile screenshots, Browser/Playwright MCP fallback behavior, and dev-server cleanup.

If shared infrastructure changed, also verify:
- a list page using `ResourceList`
- an action-menu flow
- the mobile drawer and at least one small-screen resource list
- SSR/client hydration output in the browser console

## Documentation Workflow

- Update `docs/` when frontend conventions, structure, or workflow expectations change.
- Update `agents.md` as well when the task changes workflow expectations, review rules, or agent operating instructions for future frontend work.
- After changing `agents.md` or related workflow docs, run `pnpm test:unit` as part of the same task and mention that verification in the final response.
- Keep `pnpm test:unit` on Node test discovery so newly added `*.test.ts` files run automatically without script edits.
- Prefer small incremental documentation updates over large rewrites.

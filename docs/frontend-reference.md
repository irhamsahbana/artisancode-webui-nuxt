# Frontend Reference

Use this as the primary reference for routine work in `webui/`.

## Active Stack

- Nuxt 4
- Vue 3 with `<script setup lang="ts">`
- TypeScript
- Tailwind CSS
- `@nuxtjs/i18n`
- `@nuxtjs/color-mode`
- `vitest` for component tests
- Node test runner for `*.test.ts`

Common commands:

```bash
pnpm dev
pnpm dev --port <free-port> --host 127.0.0.1
pnpm build
pnpm preview
pnpm typecheck
pnpm lint
pnpm test:component
pnpm test:unit
pnpm histoire:dev
pnpm histoire:build
```

## Project Shape

- `app/pages/`: thin route wrappers
- `app/modules/`: feature modules and page implementations, grouped by route family when the feature belongs to a segmented area
- `app/components/`: shared UI primitives and reusable shells
- `app/composables/`: shared app behavior such as auth, API, locale, and banners
- `app/utils/`: pure helpers and formatters
- `app/testing/`: shared test utilities
- `app/types/`: shared transport and reusable frontend types
- `server/api/proxy/[...path].ts`: backend proxy layer

Nuxt-specific reminders:

- Component auto-registration uses `pathPrefix: false`, so template tags follow the file name such as `<Button>` and `<ResourceList>`.
- The `~` alias points to `app/`, so avoid paths like `~/app/...`.

## Coding Rules

- Prefer existing repo patterns over introducing a new abstraction style.
- Keep route files small and move feature logic into `app/modules/`.
- When working on segmented route families, mirror the route grouping inside modules such as `app/modules/resources/hr/`, `app/modules/resources/crm/`, `app/modules/resources/shared/`, and `app/modules/internal/resources/`.
- Use Nuxt auto-imports where the repo already relies on them.
- Prefer `useApi().apiFetch(...)` over direct `$fetch` in app code.
- Use explicit local or shared types instead of `any`.
- Reuse shared UI building blocks before creating new primitives.
- Prefer Tailwind utilities first. Use scoped CSS only when utilities are not enough.
- Keep user-facing code and agent-facing docs in English unless a task explicitly requires another language.

## Shared UI Expectations

- Reuse `ResourceList`, `ResourceTable`, `FormDialogShell`, `Select`, `SearchableSelect`, `SearchableTreeSelect`, and `ui/*` primitives when they fit.
- Internal admin resource pages should prefer `InternalResourceFilterPanel` and `InternalResourceListControls` over custom filter drawers and action menus.
- Keep previous content visible during refresh when it improves orientation.
- Floating menus, selects, date pickers, and filter panels must not shift surrounding layout unless the disclosure is intentionally inline.
- Add matching `dark:` treatment when introducing explicit light-surface styling.
- Never expose raw ISO timestamps in user-facing UI.

## Data, Types, And Tests

- Shared transport types belong in `app/types/` only when multiple features use them.
- Keep feature-local DTOs and view-model types near the feature when reuse is narrow.
- Use `*.component.vitest.ts` for Vue components and composables that depend on Vue runtime behavior.
- Use `*.test.ts` for pure helpers and logic that can run under the Node test runner.
- Reuse `app/testing/component-test-utils.ts`, `app/testing/api-response-fixtures.ts`, and `app/testing/setup-component-tests.ts` before creating new one-off helpers.

## Story Testing Pattern

Use Histoire stories for shared UI building blocks, layout components, and reusable interactive states that benefit from visual review in isolation.

When to add or update a story:

- a shared component gains new variants, states, or slots
- a reusable component has tricky loading, empty, disabled, open, or theme behavior
- a layout primitive or shell needs repeatable visual review outside a full page
- a component is likely to be reused and future work would benefit from a stable visual harness

When not to default to a story:

- page-only feature wiring that is already covered by focused component tests
- pure helper logic with no visual surface
- highly coupled screens that only make sense through the real route flow

Preferred placement:

- colocate stories beside the component as `*.story.vue`
- keep shared UI stories under the same folder as the component, such as `app/components/ui/` or `app/components/layout/`

Story structure should follow the existing repo pattern:

- import `~/assets/css/main.css`
- use `defineOptions({ name: ... })`
- wrap the example in `<Story>` and one or more `<Variant>`
- expose important state through Histoire controls such as `HstSelect`, `HstCheckbox`, and `HstText`
- provide a bounded container that makes spacing, overlays, and dark mode readable
- include light and dark theme states when the component styling depends on color mode
- use `logEvent` for emitted interactions when that helps manual verification

Practical guidance:

- prefer one focused story file per reusable component
- each variant should demonstrate a meaningful state, not just duplicate markup
- keep sample data small, explicit, and deterministic
- choose stable ids and labels in stories so controls and screenshots stay readable
- if a floating menu, dropdown, or panel is involved, give the story enough height and positioning context to reveal clipping or overlay bugs
- for shared overlays that normally `Teleport` to `body`, prefer a `teleportTo?: string | null` prop so stories and tests can opt out with `null`
- Histoire stories for teleported overlays should usually pass `teleportTo=null` when the preview needs the panel, drawer, or popover to stay visually attached to the story canvas
- when a shared component is expected to render inside Histoire, do not assume Nuxt auto-imports are always available in the sandbox runtime
- for app-level composables used by shared UI, prefer explicit imports such as `import { useLocale } from '~/composables/useLocale'` instead of relying only on Nuxt auto-import discovery
- if a story stays on `Loading...` with a blank preview, check the sandbox console first; a missing composable import can fail component setup before Histoire surfaces a visible error

## Documentation Maintenance

- Update `agents.md` when future agent behavior or routing guidance changes.
- Update the matching file in `docs/` when architecture, workflow, shared UI patterns, or localization behavior changes.
- Keep docs short and task-oriented. Prefer updating an existing reference over adding another overlapping document.

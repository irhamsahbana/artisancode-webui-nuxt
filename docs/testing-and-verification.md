# Testing And Verification

Use the smallest meaningful check first, then broaden only as needed.

## Default Order

1. Run the most relevant focused test first.
2. Run `pnpm typecheck`.
3. Run `pnpm lint`.
4. Run `pnpm test:unit` when pure helpers, shared utilities, or frontend docs changed.
5. Run a browser smoke test when route behavior, layout, responsive behavior, or interactive UI changed.
6. Run `pnpm histoire:build` when shared Histoire stories changed.

## Test Placement

- `*.component.vitest.ts` for Vue components and composables that depend on Vue runtime behavior
- `*.test.ts` for pure helpers that should run under Node test discovery
- `*.story.vue` for reusable visual states that should be reviewed in isolation through Histoire

Prefer colocated tests beside the feature.

## Story Verification

When a shared Histoire story is added or changed:

1. make sure the story covers the intended interactive or visual states
2. run `pnpm histoire:build`
3. if the component changed visually, inspect it in Histoire or another browser smoke flow before finishing

Story verification is especially useful for:

- shared form controls
- overlays such as menus, selects, popovers, and filter panels
- layout primitives
- theme-sensitive components with light and dark behavior

## Browser Smoke Flow

Preferred local dev server command:

```bash
pnpm dev --port <free-port> --host 127.0.0.1
```

Recommended flow:

1. Start the dev server from `webui/`.
2. Check route and redirect behavior with `curl -sS -i <url>`.
3. Use Browser Use for local interactive checks when available.
4. Capture desktop and mobile evidence for visual or responsive changes.
5. Check for hydration warnings and runtime errors.
6. Stop the dev server before finishing.

If sandbox networking blocks localhost checks, rerun the same command with escalation instead of changing the verification strategy.

## What To Verify

- loading, empty, success, and error states
- public and protected route behavior after routing changes
- no raw ISO timestamps in user-facing screens
- no layout shift from floating menus, filters, or selects
- no console hydration warnings after shared UI changes
- no horizontal overflow on mobile when layout or page chrome changed

## Documentation Changes

When `agents.md` or frontend workflow docs change:

- run `pnpm test:unit`
- mention the documentation update in the final response

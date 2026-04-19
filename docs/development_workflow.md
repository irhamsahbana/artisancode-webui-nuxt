# Development Workflow

1. **Define UI Needs**:
  - Identify route (`app/pages/`) or component (`app/components/`) changes.
  - Determine shared logic for `app/composables/`.

2. **Implement UI**:
   - Build or update Vue components.
   - Keep state local when possible; move reusable logic into composables.

3. **Wire Data**:
   - Use `useApi().apiFetch(...)` for app API calls.
   - Use `useAsyncData` only when it matches the existing feature pattern.
   - Centralize reusable transport types in `app/types/` when needed.

4. **Add Routing & Middleware**:
  - Create or update files in `app/pages/`.
  - Add route middleware in `app/middleware/` when needed.

5. **Validate UX**:
  - Confirm loading, empty, and error states.
   - Ensure client/server rendering behaves as expected.
   - Check browser console for hydration warnings and runtime errors.
   - Verify success and error banners when form submission is involved.

## Shared Resource Flow

For CRUD-style resources, prefer the existing shared stack before building a custom page:

1. `ResourceList` for table/search/pagination shell
2. `ResourceTable` for row rendering and actions
3. feature-local modal or detail page for create/edit/view flows

Use a custom page only when the feature has significantly different behavior, such as:
- multi-section manage pages
- nested tree editing
- heavy detail views
- multi-step forms

## Verification Defaults

After meaningful changes, run:

1. `pnpm exec nuxi typecheck`
2. `pnpm lint`
3. route-level browser smoke test

If shared infrastructure changed, also verify:
- a list page using `ResourceList`
- an action-menu flow
- the mobile drawer and at least one small-screen resource list
- SSR/client hydration output in the browser console

## Documentation Workflow

- Update `docs/` when frontend conventions, structure, or workflow expectations change.
- Update `agents.md` as well when the task changes workflow expectations, review rules, or agent operating instructions for future frontend work.
- Prefer small incremental documentation updates over large rewrites.

## UI List Defaults (Benchmark: Roles & Permissions)
- **Default limit**: 15 items per page for list views.
- **Limit options**: 10, 15, 25, 50, 100.
- **Skeleton loading**:
  - Table-based lists use row skeletons while loading.
  - Checkbox lists use skeleton rows matching the current limit.

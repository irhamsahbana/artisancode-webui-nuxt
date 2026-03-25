# Development Workflow

1. **Define UI Needs**:
  - Identify route (`app/pages/`) or component (`app/components/`) changes.
  - Determine shared logic for `app/composables/`.

2. **Implement UI**:
   - Build or update Vue components.
   - Keep state local when possible; move reusable logic into composables.

3. **Wire Data**:
   - Use `useFetch` or `useAsyncData` for data fetching.
   - Centralize endpoints and DTOs in shared types when needed.

4. **Add Routing & Middleware**:
  - Create or update files in `app/pages/`.
  - Add route middleware in `app/middleware/` when needed.

5. **Validate UX**:
   - Confirm loading, empty, and error states.
   - Ensure client/server rendering behaves as expected.

## UI List Defaults (Benchmark: Roles & Permissions)
- **Default limit**: 15 items per page for list views.
- **Limit options**: 10, 15, 25, 50, 100.
- **Skeleton loading**:
  - Table-based lists use row skeletons while loading.
  - Checkbox lists use skeleton rows matching the current limit.

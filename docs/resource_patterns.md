# Resource Patterns

## Standard List Page

- Module file: `app/modules/resources/{resource-name}/{resource-name}-page.vue`
- Route wrapper: `app/pages/resources/{resource-name}.vue`
- Client admin routes should be exposed under `/app/resources/*` with `definePageMeta({ path: ... })`.
- Keep route wrappers thin and place feature logic in the module page.

## Detail And Optional-ID Routes

Dedicated detail/manage pages currently include:

- `app/pages/resources/companies/[id].vue` -> `companies-manage-page.vue`
- `app/pages/resources/org-units/[id].vue` -> `org-unit-detail-page.vue`
- `app/pages/resources/students/[id].vue` -> `student-detail-page.vue`

Optional-id wrappers currently include:

- `app/pages/resources/users.vue` -> `/app/resources/users/:id?`
- `app/pages/resources/roles.vue` -> `/app/resources/roles/:id?`
- `app/pages/resources/categories.vue` -> `/app/resources/categories/:id?`
- `app/pages/resources/teachers.vue` -> `/app/resources/teachers/:id?`
- `app/pages/resources/programs.vue` -> `/app/resources/programs/:id?`
- `app/pages/resources/enrollments.vue` -> `/app/resources/enrollments/:id?`
- `app/pages/resources/invoices.vue` -> `/app/resources/invoices/:id?`

Prefer matching the feature's existing route pattern rather than forcing every resource into one template.

## Shared Resource Flow

For CRUD-style resources, prefer this stack before building a custom page:

1. `ResourceList` for table, search, pagination, selection, and delete flow.
2. `ResourceTable` for row rendering and actions.
3. Feature-local modal or detail page for create, edit, and view flows.

Use a custom page only when behavior is significantly different, such as multi-section manage pages, nested tree editing, heavy detail views, or multi-step forms.

## Filter And Action Layout

When a resource page has dense filtering or async actions like export or refresh:

- Keep search lightweight in the `ResourceList` shell.
- Put the full filter panel, presets, and active filter chips in the `filters` slot.
- Put export or refresh CTA surfaces and lightweight summaries in `header-actions`.
- Filter panels opened from the searchbar must behave as floating overlays inside the `ResourceList` card. They should visually cover the table area, not add height to the header, push the table down, or render inline form controls beside the searchbar.
- Prefer the shared `FloatingFilterPanel` primitive for resource filter panels so overlay placement, outside-click close, width, shadow, and z-index match across resource pages.
- Do not hard-code filter panel headings from another resource. For example, only date-heavy filters should show date-specific headings such as `Filter by date`; generic resource filters should receive headings from the parent or use a neutral `Filters` title.
- Resource action menus should use the shared `ActionMenu` primitive instead of custom three-dot dropdown markup when the visual behavior matches. Parent modules should pass action item config rather than relying on hard-coded export/history labels inside a wrapper component.
- If a resource has both a filter trigger and an action menu, the two open states must be coordinated: opening one closes the other. Outside clicks must close the currently open overlay/menu.
- Header actions such as `Add New` and the three-dot action menu should sit on the same row as the searchbar at desktop widths. Primary create buttons should be grouped next to the action menu on the right, not wrapped onto a separate line unless the viewport is too narrow.
- Header action wrapper components must not force `w-full` unless the parent intends a full-width surface. Compact controls such as three-dot menus should be `shrink-0` so adjacent buttons stay aligned.
- Dropdowns inside floating filter panels, including `SearchableSelect` and date pickers, must render as floating/ported overlays when needed so their option lists/calendars are not clipped by the filter panel's scroll container or footer.

## List Defaults

- Default limit: 15 items per page.
- Limit options: 10, 15, 25, 50, 100.
- Table-based lists use row skeletons while loading.
- Checkbox lists use skeleton rows matching the current limit.
- Initial load may use full skeleton content, but subsequent refreshes should prefer inline progress while keeping current rows visible.

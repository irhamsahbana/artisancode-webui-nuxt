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

## List Defaults

- Default limit: 15 items per page.
- Limit options: 10, 15, 25, 50, 100.
- Table-based lists use row skeletons while loading.
- Checkbox lists use skeleton rows matching the current limit.
- Initial load may use full skeleton content, but subsequent refreshes should prefer inline progress while keeping current rows visible.

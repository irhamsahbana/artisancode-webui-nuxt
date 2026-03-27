# Coding Conventions

## Naming

- **Files & Folders**: `kebab-case` for directories and file names (e.g., `user-profile.vue`).
- **Components**: `PascalCase` for component names (e.g., `UserProfileCard.vue`).
- **Composables**: `useXxx` prefix (e.g., `useAuth`, `useCart`).
- **Variables/Functions**: `camelCase`.
- **Types/Interfaces**: `PascalCase` (e.g., `UserProfile`).

## Vue & Nuxt Patterns

- **Script Setup**: Prefer `<script setup lang="ts">`.
- **Auto Imports**: Use Nuxt auto-imports for composables and utilities.
- **Props & Emits**: Define `defineProps` and `defineEmits` explicitly.
- **Runtime Config**: Use `useRuntimeConfig()` for environment-based values.

## Error Handling

- Use Nuxt error helpers for user-facing errors:
  - `createError({ statusCode, statusMessage })`
  - `showError(error)`
- Avoid throwing generic `Error` for predictable UI states; handle locally with UI feedback.

## Styling

- Prefer scoped styles for component-specific rules.
- Keep shared styles in `app/assets/` (e.g., `app/assets/styles/`).

## Vue Template Rules

- Follow `vue/max-attributes-per-line` eslint rule:
  - ✅ Place **each attribute on its own new line** when there are multiple attributes
  - ✅ Do not put multiple attributes on the same line
  - ✅ Always break to new line after 1 attribute for component tags

  ✅ Correct:

  ```vue
  <TreeView
    :items="orgTree"
    :level="1"
    @click="handleClick"
  />
  ```

  ❌ Wrong:

  ```vue
  <TreeView :items="orgTree" :level="1" @click="handleClick" />
  ```

## Quality Checks

- ✅ Always check for eslint warnings after making changes
- ✅ Fix all warnings before declaring completion
- ✅ Run `pnpm lint` to verify before finishing a task
- ✅ Never ignore or leave eslint warnings

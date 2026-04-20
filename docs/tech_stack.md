# Tech Stack

## Active Runtime Stack

- **Runtime**: Node.js
- **Package Manager**: pnpm
- **Language**: TypeScript
- **Framework**: Nuxt 4
- **UI Framework**: Vue 3
- **Router**: Vue Router 4 via Nuxt file routing
- **Styling**: Tailwind CSS
- **Theme / Color Mode**: `@nuxtjs/color-mode`
- **Data Fetching**: `ofetch` wrapped by `useApi().apiFetch(...)`
- **Server Layer**: Nitro route proxy at `server/api/proxy/[...path].ts`
- **Icons**: `lucide-vue-next`
- **Validation Libraries Present**: `zod`, `vee-validate`
- **Linting**: ESLint
- **Style Linting**: Stylelint
- **Formatting**: Prettier
- **Type Checking**: `pnpm typecheck` (`nuxi typecheck`)

## UI Building Blocks

The active UI system is Vue-first and local-component-first:

- local primitives under `app/components/ui/`
- shared CRUD shells such as `ResourceList` and `ResourceTable`
- shared app shell in `app/layouts/default.vue`

Although some non-Vue packages may still exist in `package.json`, frontend implementation work should follow the active Nuxt/Vue component stack unless the codebase is intentionally being migrated.

## Runtime Configuration

Key runtime config values used by the app today:

- `runtimeConfig.apiBase`
- `runtimeConfig.public.appName`

## Common Commands

```bash
pnpm dev
pnpm build
pnpm preview
pnpm typecheck
pnpm lint
```

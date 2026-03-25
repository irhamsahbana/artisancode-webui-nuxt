# User Preferences

- Be objective and truthful, even if it may be difficult to hear.
- When editing files, always use absolute paths.
- When making changes to a file, explain why the change is being made.
- When generating code, add comments in English.
- **Shell & Package Manager**:
  - Use `fish` (preferred) or `bash` for shell commands.
  - Use `pnpm` for package management (installing dependencies).
  - **Running the App**: Use `pnpm dev` for local development, `pnpm build` for production builds, and `pnpm preview` for local previews.
- **UI System**:
  - Use shadcn/ui patterns with Tailwind CSS utilities.
  - Reuse components under `app/components/ui/` and `app/components/resource/` before creating new ones.
  - Keep shared classnames in `app/utils/utils.ts` via the `cn` helper.
- **Tech Stack**:
  - Nuxt 4 + Vue 3 + TypeScript + Tailwind CSS are the primary UI stack.
  - Prefer existing utilities/composables over adding new dependencies.
- **App Structure**:
  - Use the Nuxt 4 `app/` directory for pages, components, composables, middleware, assets, and modules.
  - Place feature logic under `app/modules/` and keep `app/pages/` as thin route wrappers.
  - Centralize shared `.types.ts` under `app/types/`.
  - The `~` alias points to the `app/` root; avoid `~/app/...` to prevent double paths.
  - Prefer `~` alias imports over `../` relative imports inside `app/` to avoid deep relative paths.
- **Documentation Maintenance**:
  - The AI agent is authorized to update `docs/` files to keep them accurate.
  - **Protocol**:
    1. **Inform**: When making documentation changes, explicitly mention them in the final response.
    2. **Suggest**: If the AI detects that the codebase patterns (e.g., new folder structure, new library) deviate from the existing docs, it must proactively suggest updating the relevant documentation file.

# Quick Summary

- **Framework**: Nuxt 4 (Vue 3)
- **UI**: shadcn/ui + Tailwind CSS

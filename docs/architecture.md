# Architecture

The web UI uses **Nuxt 4** with Vue 3 and the standard Nuxt directory structure.
Project root: `webui/`

## Key Directories

1. **app/**: Nuxt app entry (e.g., `app.vue`), layouts, and app-level UI.
2. **app/pages/**: File-based routing. Each `.vue` file becomes a route.
3. **app/components/**: Reusable UI components.
4. **app/composables/**: Reusable composition functions (`useXxx`).
5. **app/middleware/**: Route middleware for auth/guards.
6. **app/assets/**: Uncompiled assets (SCSS, images used by CSS).
7. **public/**: Static files served as-is.
8. **server/**: Optional Nitro server routes and server utilities.

## Path Aliases

- `~` maps to the `app/` root for this project.
- Use `~/assets/...` for assets under `app/assets/`.
- Avoid `~/app/...` to prevent double `app/` paths.

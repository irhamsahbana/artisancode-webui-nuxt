# Localization

## Active Setup

The frontend uses `@nuxtjs/i18n` with:

- default locale `id`
- secondary locale `en`
- `prefix_except_default` routing
- locale cookie `ac_locale`

Key files:

- `nuxt.config.ts`
- `i18n/locales/id.ts`
- `i18n/locales/en.ts`
- `app/composables/useLocale.ts`
- `app/composables/useApi.ts`
- `server/api/proxy/[...path].ts`

## Rules

- Use keyed messages through `useLocale().t(...)` or `useLocale().format(...)`.
- Do not add raw-string translation fallbacks or feature-local translation maps.
- Keep `id.ts` and `en.ts` in sync when adding or removing keys.
- Prefer existing shared namespaces before creating new keys.
- Use `useLocalePath()` for localized navigation and route objects.
- Let `useApi()` handle `Accept-Language`. Do not set it manually in feature code.

## Flow

1. UI reads and changes locale through `useLocale()`.
2. Nuxt i18n updates the current route and `ac_locale` cookie.
3. Feature code renders copy from locale keys.
4. `useApi()` forwards the active locale through `Accept-Language`.
5. Nitro proxy passes the header to the backend.

## Review Checklist

- New user-facing copy is backed by locale keys.
- Localized routes still resolve after navigation changes.
- Shared components are clear about whether they accept translated strings or keys.
- Deleted features also remove stale locale keys.
- Proxy fallback messages are translated in `server/api/proxy/[...path].ts`, so backend-down scenarios still follow current locale.

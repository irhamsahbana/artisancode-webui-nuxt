# Localization

## Current State

Web UI multi-language is implemented with `@nuxtjs/i18n` for Indonesian (`id`) and English (`en`).

Main building blocks:

- `nuxt.config.ts`
  - Registers `@nuxtjs/i18n`.
  - Uses `prefix_except_default`, so Indonesian keeps unprefixed URLs and English uses `/en/...`.
  - Persists browser language selection in cookie `ac_locale`.
- `i18n/locales/id.ts` and `i18n/locales/en.ts`
  - Store keyed application messages.
- `app/composables/useLocale.ts`
  - Wraps Nuxt i18n for app code.
  - Exposes `locale`, `setLocale`, `t`, `format`, and locale switcher options.
  - Exposes `text(...)` only for shared components that still receive raw UI labels.
- `app/composables/useApi.ts`
  - Sends `Accept-Language` header on every API request using current UI locale.
- `server/api/proxy/[...path].ts`
  - Proxies the header to backend.
  - Localizes proxy-level fallback errors when backend is unreachable.
- `app/app.vue`
  - Sets `<html lang>` from current locale.
- `app/layouts/default.vue`
  - Provides the main language switcher and locale-aware navigation.

## Supported Locales

- `id` is default.
- `en` is supported end-to-end in the current UI flow.

## How Locale Flows

1. User picks language from UI.
2. `useLocale().setLocale(...)` delegates to Nuxt i18n, updates cookie `ac_locale`, and changes the localized route when needed.
3. Components read translated copy through `t(...)` or `format(...)`.
4. `useApi()` sends `Accept-Language: id|en`.
5. Nuxt proxy forwards request to backend.
6. Backend returns localized `message` and `errors`.

## When To Use Which Helper

Use `useLocale().t(...)` when:

- text is app-owned copy
- label can be represented by a stable key
- text should live with other shared messages

Use `useLocale().format(...)` when:

- message contains placeholders like `{name}` or `{selected}`

Use `useLocale().text(...)` when:

- a shared component receives raw literal strings through props
- the string comes from generic table/filter/select configuration
- moving the caller to keyed translations would make the change larger than the feature

For new product copy, prefer keyed messages in `i18n/locales/*.ts` over adding more raw-string mappings.

Use `useLocalePath()` when:

- creating `NuxtLink` destinations
- calling `navigateTo(...)`
- pushing app routes with `router.push(...)`
- building route objects for resource links

## Change Rules

- Do not hardcode user-facing copy when an existing locale key fits.
- Do not send language headers manually from feature code. Use `useApi()`.
- Do not create a second locale store.
- Keep `i18n/locales/id.ts` and `i18n/locales/en.ts` entries in sync when adding new locale keys.
- Keep internal routes locale-aware with `useLocalePath()`.
- If a page mixes `t(...)` and `text(...)`, prefer migrating new or changed product copy to keyed messages.

## Backend Integration Notes

- Backend language selection depends on `Accept-Language`.
- If frontend locale changes but API errors remain Indonesian, first verify the request header is being sent through `useApi()`.
- Proxy fallback messages are translated in `server/api/proxy/[...path].ts`, so backend-down scenarios still follow current locale.

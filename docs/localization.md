# Localization

## Current State

Web UI multi-language is already implemented for Indonesian (`id`) and English (`en`).

Main building blocks:

- `app/composables/useLocale.ts`
  - Holds locale state.
  - Persists selected locale in cookie `ac_locale`.
  - Exposes `locale`, `setLocale`, `t`, `format`, and locale switcher options.
- `app/composables/useApi.ts`
  - Sends `Accept-Language` header on every API request using current UI locale.
- `server/api/proxy/[...path].ts`
  - Proxies the header to backend.
  - Localizes proxy-level fallback errors when backend is unreachable.
- `app/utils/ui-localization.ts`
  - Maps raw UI strings that are still plain-text and not yet moved into keyed messages.
- `app/app.vue`
  - Sets `<html lang>` from current locale.
- `app/layouts/default.vue`
  - Provides the main language switcher.

## Supported Locales

- `id` is default.
- `en` is supported end-to-end in the current UI flow.

## How Locale Flows

1. User picks language from UI.
2. `useLocale().setLocale(...)` updates state and cookie `ac_locale`.
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

Use `localizeUiText(...)` from `app/utils/ui-localization.ts` when:

- the component still works with raw literal strings
- the string comes from shared generic UI helpers
- migrating to keyed translations would be larger than the task

For new product copy, prefer keyed messages in `useLocale.ts` over adding more raw-string mappings.

## Change Rules

- Do not hardcode user-facing copy when an existing locale key fits.
- Do not send language headers manually from feature code. Use `useApi()`.
- Do not create a second locale store.
- Keep `id` and `en` entries in sync when adding new locale keys.
- If a page mixes `t(...)` and `localizeUiText(...)`, keep the pattern consistent unless you are intentionally refactoring it.

## Backend Integration Notes

- Backend language selection depends on `Accept-Language`.
- If frontend locale changes but API errors remain Indonesian, first verify the request header is being sent through `useApi()`.
- Proxy fallback messages are translated in `server/api/proxy/[...path].ts`, so backend-down scenarios still follow current locale.

# UI System

## Foundations

- Use the existing shadcn-style component patterns with Tailwind utilities.
- Reuse components under `app/components/` before creating new ones.
- Keep shared class composition in `app/utils/utils.ts` via `cn` when class merging is needed.
- Prefer utility-first styling. Add scoped CSS only when Tailwind utilities are not enough.
- Any explicit light surface colors such as `bg-white`, `text-slate-900`, or light gradients must ship with matching `dark:` variants.
- In dark mode, prioritize readable text and control contrast over preserving the exact light-mode look.

## Interaction And Loading

- Prefer non-blocking route transitions for data-heavy pages.
- Avoid `await useAsyncData(...)` in route and shared list shells when the fetch is only needed for in-page content.
- Keep previous data visible during refresh, filter changes, or background reloads when it helps preserve orientation.
- Use skeletons that resemble the final layout for shared list and dashboard shells.
- Floating menus, select dropdowns, date pickers, and filter panels must not change the height of the layout they are opened from unless the component is intentionally an inline disclosure. Use shared floating primitives or `Teleport`/fixed positioning when a dropdown lives inside a scrollable panel, table header, card, or modal where it could otherwise be clipped.
- Related floating surfaces must coordinate open state when they share a trigger area. For example, opening a filter panel should close the neighboring action menu, and opening the action menu should close the filter panel.
- Outside-click close should be implemented consistently for transient overlays and menus. Transparent backdrops are acceptable when they preserve visual context and prevent multiple surfaces from staying open.

## App Shell

- Treat shell elements as first-class UI.
- Sidebar groups, active states, and footer/auth areas should be visually stable.
- Page headers should anchor the screen with clear hierarchy.
- Dashboard metrics should read as cards with visible separation in light and dark themes.

## Date And Time Readability

- Never display raw ISO timestamps such as `2026-04-23T06:08:21.480291+08:00` in user-facing UI.
- Use `useDateTime()` in Vue components and `app/utils/date-time.ts` in utilities.
- Use `formatReadableDateTime(...)` for date/time values that users need to quickly understand in cards, dialogs, status summaries, and tables.
- Use date-only helpers for birth dates, join dates, and filter inputs where time is not meaningful.
- Preserve raw timestamps only for API payloads, exports intended for machines, or debug-only contexts.
- If a timestamp cannot be parsed, prefer a neutral fallback such as `-` in display UI rather than leaking backend formatting.

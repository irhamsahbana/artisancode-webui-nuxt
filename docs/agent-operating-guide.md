# Agent Operating Guide

## Core Expectations

- Be objective and truthful, even when the tradeoff is uncomfortable.
- When editing files, use absolute paths in communication and tool references.
- Explain why a file is being changed before editing it.
- Add code comments in English, and only when they clarify non-obvious logic.

## Shell And Commands

- Use `fish` when it fits the local environment; `bash` or the current shell is acceptable for simple commands.
- Use `pnpm` for package management.
- Common commands:
  - `pnpm dev`
  - `pnpm build`
  - `pnpm preview`
  - `pnpm lint`
  - `pnpm test:unit`
  - `pnpm typecheck`
  - `pnpm exec nuxi typecheck`

## Documentation Maintenance

- Update `docs/` when frontend conventions, structure, workflow expectations, or user-facing patterns change.
- Update `agents.md` when future agent operating instructions need to change.
- Keep `agents.md` short; put durable details in focused docs files.
- Write agent-facing documentation in English unless a task explicitly requires another language.
- If codebase behavior drifts from the docs, update the relevant doc in the same task when practical.
- If helper logic changes, add or update unit tests for that behavior and run `pnpm test:unit`.
- `pnpm test:unit` should rely on Node test discovery so new `*.test.ts` coverage runs without editing the script.
- Prefer colocated test files for resource work: `*.component.vitest.ts` for Vue components/composables and `*.test.ts` for pure helpers.
- Prefer shared test utilities in `app/testing/` before creating per-file mount helpers or API response fixtures.
- If `agents.md` or related workflow/docs files change, rerun `pnpm test:unit` so documentation changes stay coupled to executable verification.
- Mention documentation changes in the final response.

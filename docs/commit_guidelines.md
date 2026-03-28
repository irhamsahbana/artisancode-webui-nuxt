# AI Agent Commit Guidelines

This document outlines how the AI Agent should handle git commits. The primary goal is to maintain a clean, semantic history that accurately reflects the changes made.

## Process

1. **Analyze Changes**:
   - Before generating a commit message, **always** check the actual file changes.
   - Do not assume; verify exactly what was modified, added, or deleted.

2. **Determine Scope**:
   - Identify which part of the codebase is affected (e.g., `auth`, `layout`, `resources`, `components`, `docs`).
   - If changes span multiple distinct areas, consider splitting them into separate commits if possible, or use a broader scope/description.

3. **Format Message**:
   - Follow the **Conventional Commits** specification.
   - Structure: `<type>(<scope>): <description>`

## Conventional Commits Specification

### Types
- **feat**: A new feature.
- **fix**: A bug fix.
- **docs**: Documentation only changes.
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc).
- **refactor**: A code change that neither fixes a bug nor adds a feature.
- **perf**: A code change that improves performance.
- **test**: Adding missing tests or correcting existing tests.
- **chore**: Changes to the build process or auxiliary tools and libraries.

### Scope
- The scope provides additional context to the commit type.
- It should be a noun describing a section of the codebase.
- Common scopes in this repo:
  - `auth`
  - `layout`
  - `resources`
  - `components`
  - `proxy`
  - `types`
  - `docs`
  - `deps`

### Description
- Use the imperative, present tense: "change" not "changed" nor "changes".
- Don't capitalize the first letter.
- No dot (.) at the end.

## Examples

- **Good**: `feat(resources): add attendance logs page`
- **Good**: `fix(components): resolve resource table menu error`
- **Good**: `fix(layout): prevent hydration mismatch on resource pages`
- **Good**: `docs(architecture): update resource page patterns`
- **Good**: `chore(deps): upgrade nuxt`

- **Bad**: `Fixed the login bug`
- **Bad**: `Update code`
- **Bad**: `feat: Added new UI`

## Auto-Commit Behavior
- When the user asks to "commit", apply these rules automatically.
- Ensure the commit message is derived strictly from the **staged changes**.
- If both docs and product code changed, prefer separate commits when the documentation update is independently meaningful.

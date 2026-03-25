# Mock Data & Fixtures

This document describes how to manage mock data for local UI development.

## Fixtures Structure

- Keep mock data in `mocks/` or `fixtures/`.
- Group files by feature (e.g., `fixtures/user.ts`, `fixtures/orders.ts`).

## Usage

- Use fixtures for story-like UI development and offline demos.
- Prefer strongly typed fixtures that match DTOs.
- If mock data is used in tests, ensure it is deterministic and minimal.

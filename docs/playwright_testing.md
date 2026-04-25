# Playwright And Browser Smoke Testing

Use this guide when a frontend change needs route, layout, responsive, or browser behavior verification.

## When To Use

Run browser-level checks after changes that affect:

- public pages, auth routes, routing, or middleware
- responsive layout, visual hierarchy, or CTA behavior
- app shell, navigation, drawers, dialogs, or floating menus
- SSR/client hydration behavior
- user-facing forms or flows that need runtime verification

Do not replace `pnpm typecheck` or `pnpm lint` with browser checks. Use browser checks after the code passes the smallest meaningful static verification.

## Preferred Flow

1. Start the frontend dev server from `webui/`.
   - Preferred command: `pnpm dev --port <free-port> --host 127.0.0.1`
   - If the sandbox cannot bind or connect to localhost, rerun the same command with escalation.
   - If Nuxt chooses an alternate port, use the URL printed by Nuxt.

2. Verify route behavior with HTTP before opening a browser.
   - Use `curl -sS -i <url>` for status and redirect checks.
   - For protected routes, test both without cookies and with the minimum relevant auth cookie when route access is the only thing being checked.
   - Example checks:
     - public route returns `200`
     - protected `/app` redirects to `/login` without token
     - protected `/app` returns `200` with a token cookie
     - `/login` still returns `200`

3. Use Browser/Playwright MCP for interactive inspection when available.
   - Navigate to the local URL.
   - Capture an accessibility snapshot before relying on screenshots for structure.
   - Take desktop and mobile screenshots for visual changes.
   - Check browser console or visible runtime errors when the tool exposes them.

4. If Browser/Playwright MCP is locked or unavailable, use Chrome headless screenshots.
   - This is an accepted fallback for visual smoke checks.
   - Use full absolute Chrome path on macOS:
     - `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
   - Desktop example:
     - `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --headless=new --disable-gpu --no-first-run --no-default-browser-check --window-size=1440,1200 --screenshot=/tmp/page-desktop.png http://127.0.0.1:<port>/`
   - Mobile example:
     - `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --headless=new --disable-gpu --no-first-run --no-default-browser-check --window-size=390,1200 --screenshot=/tmp/page-mobile.png http://127.0.0.1:<port>/`
   - Review screenshots with `view_image`.
   - Treat clipped text, horizontal overflow, hidden CTA text, or overlapping product mocks as failures and fix them before finishing.

5. Stop the dev server after verification.
   - If the session cannot receive stdin, find the process with `lsof -ti tcp:<port>` and stop it with `kill <pid>`.
   - Do not leave dev-server sessions running at the end of the task.

## Responsive Checklist

For marketing pages and app-shell changes, verify at least:

- desktop width around `1440px`
- mobile width around `390px`
- no horizontal overflow
- no clipped headline, CTA, nav, or mock UI text
- primary CTA visible and tappable
- focus states remain visible on links and buttons
- product visuals use stable dimensions and do not cause layout shift
- first viewport communicates the page purpose without relying on below-the-fold content

## Route Checklist

For public/protected route changes, verify:

- public routes are reachable without auth
- protected app routes redirect without auth
- protected app routes render with the expected auth cookie
- login/register/auth routes keep existing behavior
- localized routes still resolve when the changed route is locale-aware

## Notes From Prior Landing Page Work

- Nuxt may report that the requested port is unavailable and select an alternate port. Use the actual printed local URL.
- Localhost `curl` can fail inside the sandbox even when the dev server is running. Escalate the same command rather than changing the test strategy.
- Browser MCP can fail with a browser-profile lock. Do not block on that if Chrome headless can capture the needed screenshots.
- Headless mobile screenshots are useful for detecting overflow; if text appears clipped, constrain the mobile layout explicitly instead of relying only on `overflow-x-hidden`.
- When a doc or `agents.md` change records a testing workflow, run `pnpm test:unit` and mention it in the final response.


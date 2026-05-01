import assert from "node:assert/strict";
import test from "node:test";

const {
  getAuthLoginPath,
  getAuthLogoutPath,
  getAuthRefreshPath,
  isAuthenticatedMode,
  shouldAttemptTokenRefresh,
} = await import(new URL("./auth-session.ts", import.meta.url).href);

test("returns auth session paths per mode", () => {
  assert.equal(getAuthRefreshPath("user"), "/users/refresh-token");
  assert.equal(getAuthRefreshPath("internal"), "/internal-users/refresh-token");
  assert.equal(getAuthLogoutPath("user"), "/users/logout");
  assert.equal(getAuthLogoutPath("internal"), "/internal-users/logout");
  assert.equal(getAuthLoginPath("user"), "/login");
  assert.equal(getAuthLoginPath("internal"), "/app/internal/login");
});

test("detects authenticated auth modes", () => {
  assert.equal(isAuthenticatedMode("user"), true);
  assert.equal(isAuthenticatedMode("internal"), true);
  assert.equal(isAuthenticatedMode("none"), false);
});

test("only refreshes authenticated requests after 401", () => {
  assert.equal(shouldAttemptTokenRefresh(401, "user"), true);
  assert.equal(shouldAttemptTokenRefresh(401, "internal"), true);
  assert.equal(shouldAttemptTokenRefresh(403, "user"), false);
  assert.equal(shouldAttemptTokenRefresh(401, "none"), false);
});

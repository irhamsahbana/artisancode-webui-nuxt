export type AuthMode = "user" | "internal" | "none";

export const isAuthenticatedMode = (
  authMode: AuthMode
): authMode is Exclude<AuthMode, "none"> =>
  authMode === "user" || authMode === "internal";

export const getAuthRefreshPath = (authMode: Exclude<AuthMode, "none">) =>
  authMode === "internal"
    ? "/internal-users/refresh-token"
    : "/users/refresh-token";

export const getAuthLogoutPath = (authMode: Exclude<AuthMode, "none">) =>
  authMode === "internal" ? "/internal-users/logout" : "/users/logout";

export const getAuthLoginPath = (authMode: Exclude<AuthMode, "none">) =>
  authMode === "internal" ? "/app/internal/login" : "/login";

export const shouldAttemptTokenRefresh = (status: number, authMode: AuthMode) =>
  status === 401 && isAuthenticatedMode(authMode);

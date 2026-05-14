export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/auth/check-email",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/invitation",
  "/auth/email-verification",
  "/auth/tenant-setup",
  "/app/internal/login",
] as const

export const GUEST_ONLY_ROUTES = [
  "/login",
  "/register",
  "/auth/forgot-password",
  "/auth/invitation",
  "/auth/reset-password",
  "/app/internal/login",
] as const

export const INTERNAL_ROUTE_PREFIXES = [
  "/app/internal",
] as const

export const isInternalRoute = (path: string) =>
  INTERNAL_ROUTE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))

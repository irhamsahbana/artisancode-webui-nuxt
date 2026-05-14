import { defineNuxtRouteMiddleware, navigateTo, useCookie } from "#app";
import type { RouteLocationNormalized } from "vue-router";

import {
  extractProductAccessFromToken,
  getProductHomePath,
  isProductRouteAllowed,
} from "~/utils/product-mode";
import {
  PUBLIC_ROUTES,
  GUEST_ONLY_ROUTES,
  isInternalRoute,
} from "~/utils/route-config";

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized) => {
  const token = useCookie<string | null>("sb_token");
  const internalToken = useCookie<string | null>("sb_internal_token");
  const normalizedPath = to.path.replace(/^\/en(?=\/|$)/, "") || "/";
  const localePrefix = to.path.startsWith("/en") ? "/en" : "";
  const isInternal = isInternalRoute(normalizedPath);
  const activeToken = isInternal ? internalToken : token;
  const isPublicPage = PUBLIC_ROUTES.includes(
    normalizedPath as (typeof PUBLIC_ROUTES)[number]
  );
  const isGuestOnlyPage = GUEST_ONLY_ROUTES.includes(
    normalizedPath as (typeof GUEST_ONLY_ROUTES)[number]
  );
  const productAccess = extractProductAccessFromToken(token.value);

  if (!activeToken.value && !isPublicPage) {
    return navigateTo(
      `${localePrefix}${isInternal ? "/app/internal/login" : "/login"}`
    );
  }
  if (activeToken.value && isGuestOnlyPage) {
    return navigateTo(
      `${localePrefix}${isInternal ? "/app/internal/users" : "/app"}`
    );
  }
  if (
    !isInternal &&
    activeToken.value &&
    !isPublicPage &&
    !isProductRouteAllowed(productAccess.enabledProducts, normalizedPath)
  ) {
    return navigateTo(
      `${localePrefix}${getProductHomePath(productAccess.primaryProduct)}`
    );
  }
});

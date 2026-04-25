import { defineNuxtRouteMiddleware, navigateTo, useCookie } from '#app'
import type { RouteLocationNormalized } from 'vue-router'

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized) => {
  const token = useCookie<string | null>('sb_token')
  const internalToken = useCookie<string | null>('sb_internal_token')
  const normalizedPath = to.path.replace(/^\/en(?=\/|$)/, '') || '/'
  const localePrefix = to.path.startsWith('/en') ? '/en' : ''
  const isInternalRoute = normalizedPath.startsWith('/app/internal')
  const activeToken = isInternalRoute ? internalToken : token
  const isPublicPage = normalizedPath === '/'
    || normalizedPath === '/login'
    || normalizedPath === '/register'
    || normalizedPath === '/auth/check-email'
    || normalizedPath === '/auth/forgot-password'
    || normalizedPath === '/auth/reset-password'
    || normalizedPath === '/auth/invitation'
    || normalizedPath === '/auth/email-verification'
    || normalizedPath === '/app/internal/login'
  const isGuestOnlyPage = normalizedPath === '/login'
    || normalizedPath === '/register'
    || normalizedPath === '/auth/forgot-password'
    || normalizedPath === '/auth/invitation'
    || normalizedPath === '/auth/reset-password'
    || normalizedPath === '/app/internal/login'

  if (!activeToken.value && !isPublicPage) {
    return navigateTo(`${localePrefix}${isInternalRoute ? '/app/internal/login' : '/login'}`)
  }
  if (activeToken.value && isGuestOnlyPage) {
    return navigateTo(`${localePrefix}${isInternalRoute ? '/app/internal/users' : '/app'}`)
  }
})

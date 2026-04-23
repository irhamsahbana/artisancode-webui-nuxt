import { defineNuxtRouteMiddleware, navigateTo, useCookie } from '#app'
import type { RouteLocationNormalized } from 'vue-router'

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized) => {
  const token = useCookie<string | null>('sb_token')
  const normalizedPath = to.path.replace(/^\/en(?=\/|$)/, '') || '/'
  const localePrefix = to.path.startsWith('/en') ? '/en' : ''
  const isPublicPage = normalizedPath === '/login'
    || normalizedPath === '/register'
    || normalizedPath === '/auth/check-email'
    || normalizedPath === '/auth/forgot-password'
    || normalizedPath === '/auth/reset-password'
    || normalizedPath === '/auth/invitation'
    || normalizedPath === '/auth/email-verification'
  const isGuestOnlyPage = normalizedPath === '/login'
    || normalizedPath === '/register'
    || normalizedPath === '/auth/forgot-password'
    || normalizedPath === '/auth/invitation'
    || normalizedPath === '/auth/reset-password'

  if (!token.value && !isPublicPage) {
    return navigateTo(`${localePrefix}/login`)
  }
  if (token.value && isGuestOnlyPage) {
    return navigateTo(localePrefix || '/')
  }
})

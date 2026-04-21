import { defineNuxtRouteMiddleware, navigateTo, useCookie } from '#app'
import type { RouteLocationNormalized } from 'vue-router'

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized) => {
  const token = useCookie<string | null>('sb_token')
  const isPublicPage = to.path === '/login'
    || to.path === '/register'
    || to.path === '/auth/check-email'
    || to.path === '/auth/forgot-password'
    || to.path === '/auth/reset-password'
    || to.path === '/auth/invitation'
    || to.path === '/auth/email-verification'
  const isGuestOnlyPage = to.path === '/login'
    || to.path === '/register'
    || to.path === '/auth/forgot-password'
    || to.path === '/auth/invitation'
    || to.path === '/auth/reset-password'

  if (!token.value && !isPublicPage) {
    return navigateTo('/login')
  }
  if (token.value && isGuestOnlyPage) {
    return navigateTo('/')
  }
})

import { defineNuxtRouteMiddleware, navigateTo, useCookie } from '#app'
import type { RouteLocationNormalized } from 'vue-router'

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized) => {
  const token = useCookie<string | null>('sb_token')
  const isAuthPage = to.path === '/login' || to.path === '/register'

  if (!token.value && !isAuthPage) {
    return navigateTo('/login')
  }
  if (token.value && isAuthPage) {
    return navigateTo('/')
  }
})

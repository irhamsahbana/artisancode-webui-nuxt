import { defineNuxtRouteMiddleware, navigateTo, useCookie } from '#app'
import type { RouteLocationNormalized } from 'vue-router'

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized) => {
  const token = useCookie<string | null>('sb_token')
  const isLogin = to.path === '/login'

  if (!token.value && !isLogin) {
    return navigateTo('/login')
  }
  if (token.value && isLogin) {
    return navigateTo('/')
  }
})

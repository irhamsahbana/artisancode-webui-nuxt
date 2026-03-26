import { navigateTo, useCookie, useState } from '#app'

import type { ApiResponse } from '~/types/api'
import { useApi } from './useApi'

type LoginPayload = {
  email: string
  password: string
  tenant_id: string
}

type RegisterPayload = {
  name: string
  username: string
  email: string
  password: string
  tenant_code: string
  tenant_name: string
}

type AuthTokenResponse = {
  access_token: string
  refresh_token: string
}

export const useAuth = () => {
  const token = useCookie<string | null>('sb_token')
  const refreshToken = useCookie<string | null>('sb_refresh_token')
  const { apiFetch } = useApi()

  // Extract user from JWT token
  const user = computed(() => {
    if (!token.value) return null
    try {
      const payload = token.value.split('.')[1]
      const decoded = JSON.parse(atob(payload || ''))
      return {
        id: decoded.user_id,
        tenant_id: decoded.tenant_id,
        tenant_name: decoded.tenant_name,
        username: decoded.user_name,
        roles: decoded.roles,
        name: decoded.user_name, // fallback for UI
      }
    } catch {
      return null
    }
  })

  const login = async (payload: LoginPayload) => {
    const response = await apiFetch<AuthTokenResponse>('/users/login', {
      method: 'POST',
      body: payload,
    })

    if (response.success && response.data) {
      token.value = response.data.access_token
      refreshToken.value = response.data.refresh_token
    }

    return response as ApiResponse<AuthTokenResponse>
  }

  const register = async (payload: RegisterPayload) => {
    const response = await apiFetch<AuthTokenResponse>('/users/register', {
      method: 'POST',
      body: payload,
    })

    if (response.success && response.data) {
      token.value = response.data.access_token
      refreshToken.value = response.data.refresh_token
    }

    return response as ApiResponse<AuthTokenResponse>
  }

  const logout = async () => {
    token.value = null
    refreshToken.value = null
    await navigateTo('/login')
  }

  return {
    token,
    refreshToken,
    user,
    login,
    register,
    logout,
  }
}

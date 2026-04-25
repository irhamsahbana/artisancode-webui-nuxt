import { navigateTo, useCookie } from '#app'

import type { ApiResponse } from '~/types/api'
import { useApi } from './useApi'

type InternalLoginPayload = {
  email: string
  password: string
}

type InternalAuthTokenResponse = {
  access_token: string
  refresh_token: string
}

export const useInternalAuth = () => {
  const token = useCookie<string | null>('sb_internal_token')
  const refreshToken = useCookie<string | null>('sb_internal_refresh_token')
  const { apiFetch } = useApi()
  const localePath = useLocalePath()

  const user = computed(() => {
    if (!token.value) {
      return null
    }

    try {
      const payload = token.value.split('.')[1]
      const decoded = JSON.parse(atob(payload || ''))
      return {
        id: decoded.user_id,
        username: decoded.user_name,
        name: decoded.user_name,
        roles: Array.isArray(decoded.roles) ? decoded.roles : [],
      }
    } catch {
      return null
    }
  })

  const login = async (payload: InternalLoginPayload) => {
    const response = await apiFetch<InternalAuthTokenResponse>('/internal-users/login', {
      method: 'POST',
      body: payload,
      authMode: 'none',
    })

    if (response.success && response.data) {
      token.value = response.data.access_token
      refreshToken.value = response.data.refresh_token
    }

    return response as ApiResponse<InternalAuthTokenResponse>
  }

  const logout = async () => {
    token.value = null
    refreshToken.value = null
    await navigateTo(localePath('/internal/login'))
  }

  return {
    token,
    refreshToken,
    user,
    login,
    logout,
  }
}

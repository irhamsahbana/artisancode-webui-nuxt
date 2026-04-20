import { navigateTo, useCookie, useState } from '#app'

import type { ApiResponse } from '~/types/api'
import { useApi } from './useApi'

type LoginPayload = {
  email: string
  password: string
  tenant_code: string
}

type RegisterPayload = {
  name: string
  username: string
  email: string
  password: string
  tenant_code: string
  tenant_name: string
  language: 'id' | 'en'
}

type AuthTokenResponse = {
  access_token: string
  refresh_token: string
}

type RegisterResponse = {
  email: string
  verification_required: boolean
}

type EmptyResponse = Record<string, never>

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
    const response = await apiFetch<RegisterResponse>('/users/register', {
      method: 'POST',
      body: payload,
    })

    return response as ApiResponse<RegisterResponse>
  }

  const verifyEmail = async (tokenValue: string) => {
    return apiFetch<EmptyResponse>('/users/verify-email', {
      method: 'POST',
      body: { token: tokenValue },
    }) as Promise<ApiResponse<EmptyResponse>>
  }

  const resendVerificationEmail = async (email: string) => {
    return apiFetch<EmptyResponse>('/users/resend-verification-email', {
      method: 'POST',
      body: { email },
    }) as Promise<ApiResponse<EmptyResponse>>
  }

  const forgotPassword = async (email: string) => {
    return apiFetch<EmptyResponse>('/users/forgot-password', {
      method: 'POST',
      body: { email },
    }) as Promise<ApiResponse<EmptyResponse>>
  }

  const resetPassword = async (tokenValue: string, password: string) => {
    return apiFetch<EmptyResponse>('/users/reset-password', {
      method: 'POST',
      body: { token: tokenValue, password },
    }) as Promise<ApiResponse<EmptyResponse>>
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
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    logout,
  }
}

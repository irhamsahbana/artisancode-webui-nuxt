import { navigateTo, useCookie, useState } from '#app'

import type { ApiResponse } from '../types/api'
import { useApi } from './useApi'

type LoginPayload = {
  username: string
  password: string
}

type LoginResponse = {
  id: string
  company_id: string
  role_id: string
  name: string
  username: string
  email: string
  phone: string
  status: string
  token: string
}

export const useAuth = () => {
  const token = useCookie<string | null>('sb_token')
  const user = useState<LoginResponse | null>('auth_user', () => null)
  const { apiFetch } = useApi()

  const login = async (payload: LoginPayload) => {
    const response = await apiFetch<LoginResponse>('/users/login', {
      method: 'POST',
      body: payload,
    })

    if (response.success && response.data) {
      token.value = response.data.token
      user.value = response.data
    }

    return response as ApiResponse<LoginResponse>
  }

  const logout = async () => {
    token.value = null
    user.value = null
    await navigateTo('/login')
  }

  return {
    token,
    user,
    login,
    logout,
  }
}

import { navigateTo, useCookie, useState } from '#app'
import { $fetch } from 'ofetch'
import type { ApiResponse } from '~/types/api'

type ApiFetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: Record<string, unknown>
  body?: BodyInit | Record<string, unknown> | null
  signal?: AbortSignal | null
}

export const useApi = () => {
  const token = useCookie<string | null>('sb_token')
  const { show } = useBanner()
  const { locale, t } = useLocale()

  const isAbortedRequestError = (error: unknown) => {
    if (!(error instanceof Error)) {
      return false
    }

    if (error.name === 'AbortError') {
      return true
    }

    const message = error.message.toLowerCase()
    if (
      message.includes('signal is aborted')
      || message.includes('request was aborted')
      || message.includes('aborted without reason')
    ) {
      return true
    }

    const cause = 'cause' in error ? error.cause : undefined
    return cause instanceof Error && cause.name === 'AbortError'
  }

  const apiFetch = async <T>(path: string, options: ApiFetchOptions = {}) => {
    const headers: Record<string, string> = {}
    if (token.value) {
      headers.Authorization = `Bearer ${token.value}`
    }
    headers['Accept-Language'] = locale.value
    const normalizedPath = path.startsWith('/') ? path : `/${path}`

    try {
      const response = await $fetch.raw<ApiResponse<T>>(`/api/proxy${normalizedPath}`, {
        method: options.method ?? 'GET',
        query: options.query,
        body: options.body,
        headers,
        signal: options.signal ?? undefined,
        ignoreResponseError: true,
      })

      const data = response._data
      const status = response.status
      const hasSuccessFlag = typeof data?.success === 'boolean'
      const message = hasSuccessFlag ? data?.message : `${t('api.requestFailed')} (${status})`

      if (status === 401 || status === 403) {
        token.value = null
        const user = useState<unknown | null>('auth_user', () => null)
        user.value = null
        show(t('api.sessionExpired'), 'error')
        await navigateTo('/login')
      }

      if (status >= 400 || (hasSuccessFlag && data?.success === false)) {
        show(message ?? t('api.requestFailed'), 'error')
      }

      if (hasSuccessFlag) {
        return data as ApiResponse<T>
      }

      return {
        success: false,
        message: message ?? t('api.requestFailed'),
        data: null,
        errors: data ?? null,
      }
    } catch (error) {
      if (isAbortedRequestError(error)) {
        return {
          success: false,
          message: '',
          data: null,
          errors: null,
        }
      }
      const message = error instanceof Error ? error.message : t('api.networkError')
      show(message, 'error')
      return {
        success: false,
        message,
        data: null,
        errors: error,
      }
    }
  }

  return { apiFetch }
}

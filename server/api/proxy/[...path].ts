import { defineEventHandler, getMethod, getQuery, getRequestHeaders, readBody, setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const method = getMethod(event)
  const query = getQuery(event)
  const body = method === 'GET' || method === 'HEAD' ? undefined : await readBody(event)
  const rawHeaders = getRequestHeaders(event)
  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(rawHeaders)) {
    if (typeof value === 'string') {
      headers[key] = value
    }
  }
  const param = event.context.params?.path
  const path = Array.isArray(param) ? param.join('/') : param ?? ''
  const base = config.apiBase.endsWith('/') ? config.apiBase.slice(0, -1) : config.apiBase
  const url = `${base}/${path}`
  const locale = String(rawHeaders['accept-language'] ?? '').toLowerCase().startsWith('en') ? 'en' : 'id'

  try {
    const response = await $fetch.raw(url, {
      method,
      query,
      body,
      headers,
      ignoreResponseError: true,
    })

    setResponseStatus(event, response.status)
    return response._data
  }
  catch (error: unknown) {
    // Walk the cause chain to detect ECONNREFUSED
    // ofetch wraps the original TypeError in a FetchError
    let isConnectionError = false
    let cause: unknown = error
    while (cause) {
      const err = cause as NodeJS.ErrnoException
      if (err?.code === 'ECONNREFUSED') {
        isConnectionError = true
        break
      }
      cause = err?.cause
    }

    const status = isConnectionError ? 502 : 500
    const message = isConnectionError
      ? (locale === 'en'
          ? 'Backend service is unavailable. Please try again later.'
          : 'Layanan backend tidak tersedia. Silakan coba lagi nanti.')
      : (locale === 'en'
          ? 'An unexpected error occurred while contacting the backend service.'
          : 'Terjadi kesalahan saat menghubungi layanan backend.')

    // Use console.warn so Nitro doesn't show it as a loud ERROR
    console.warn(
      `[proxy] ${method} ${url} failed:`,
      isConnectionError ? 'ECONNREFUSED' : (error instanceof Error ? error.message : error),
    )

    setResponseStatus(event, status)
    return {
      success: false,
      message,
      data: null,
      errors: null,
    }
  }
})

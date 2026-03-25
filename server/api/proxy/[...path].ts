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

  const response = await $fetch.raw(url, {
    method,
    query,
    body,
    headers,
    ignoreResponseError: true,
  })

  setResponseStatus(event, response.status)
  return response._data
})

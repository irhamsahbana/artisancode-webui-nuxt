export const appendResourceIdToEndpoint = (endpoint: string, id: string) => {
  const [rawPathPart, queryPart] = endpoint.split('?', 2)
  const pathPart = rawPathPart ?? ''
  const normalizedPath = pathPart.replace(/\/+$/, '')
  const resourcePath = `${normalizedPath}/${encodeURIComponent(id)}`

  return queryPart ? `${resourcePath}?${queryPart}` : resourcePath
}

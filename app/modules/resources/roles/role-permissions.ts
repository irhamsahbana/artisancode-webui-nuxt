import type { createRolesApi } from './roles-api'
import { PERMISSION_SEARCH_BATCH_LIMIT } from './roles-config.js'
import type { PermissionItem } from './types'

type RolesApi = ReturnType<typeof createRolesApi>

export const fetchPermissionsByQuery = async (
  rolesApi: RolesApi,
  query: string,
) => {
  const trimmed = query.trim()
  if (!trimmed) {
    return []
  }

  const items: PermissionItem[] = []
  let page = 1
  let lastPage = 1
  do {
    const response = await rolesApi.listPermissions({
      page,
      limit: PERMISSION_SEARCH_BATCH_LIMIT,
      q: trimmed,
    })
    if (!response.success || !response.data) {
      break
    }
    items.push(...response.data.items)
    lastPage = response.data.pagination.last_page
    page += 1
  } while (page <= lastPage)

  return items
}

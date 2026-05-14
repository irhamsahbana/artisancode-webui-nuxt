import type { PermissionItem } from './types'

export const formatRoleDeleteLabel = (row: Record<string, unknown>) => {
  const name = row.name
  if (typeof name === 'string' && name.length > 0) {
    return name
  }
  return String(row.id ?? '-')
}

export const formatRolePermissionCount = (value: unknown) => {
  const permissions = Array.isArray(value) ? value : []
  return String(permissions.length)
}

export const toggleId = (ids: string[], id: string) => {
  if (ids.includes(id)) {
    return ids.filter((item) => item !== id)
  }
  return [...ids, id]
}

export const extractPermissionItemsFromRow = (
  row: Record<string, unknown> | null,
) => {
  if (!row) {
    return []
  }

  const permissionRows = Array.isArray(row.permissions) ? row.permissions : []
  const items: PermissionItem[] = []

  permissionRows.forEach((permission) => {
    if (!permission || typeof permission !== 'object') {
      return
    }

    const record = permission as Record<string, unknown>
    const id = typeof record.id === 'string' ? record.id : ''
    if (!id) {
      return
    }

    items.push({
      id,
      name: typeof record.name === 'string' ? record.name : undefined,
      description: typeof record.description === 'string' ? record.description : undefined,
    })
  })

  return items
}

export const mergePermissionsById = (...groups: PermissionItem[][]) => {
  const map = new Map<string, PermissionItem>()

  groups.flat().forEach((permission) => {
    if (!map.has(permission.id)) {
      map.set(permission.id, permission)
    }
  })

  return Array.from(map.values())
}

export const buildRoleCreatePayload = (name: string, permissionIds: string[]) => ({
  name: name.trim(),
  permissions: permissionIds,
})

export const buildRoleUpdatePayload = (permissionIds: string[]) => ({
  permission_ids: permissionIds,
})

export const buildAdminInvitationLink = (
  appOrigin: string,
  acceptToken: string | null | undefined,
) => {
  if (!appOrigin || !acceptToken) {
    return ''
  }

  return `${appOrigin}/auth/invitation?token=${encodeURIComponent(acceptToken)}`
}

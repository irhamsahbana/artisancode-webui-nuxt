import type { ListResponse } from '~/types/api'
import type { ApiFetch, InvitationResponse, PermissionItem } from './types'
import {
  ADMIN_INVITATIONS_ENDPOINT,
  PERMISSIONS_ENDPOINT,
  ROLES_ENDPOINT,
} from './roles-config.js'

export const createRolesApi = (apiFetch: ApiFetch) => ({
  listPermissions: (
    query: Record<string, unknown>,
    signal?: AbortSignal | null,
  ) => apiFetch<ListResponse<PermissionItem>>(PERMISSIONS_ENDPOINT, {
    query,
    signal,
  }),

  createRole: (name: string, permissionIds: string[]) => apiFetch(ROLES_ENDPOINT, {
    method: 'POST',
    body: {
      name,
      permissions: permissionIds,
    },
  }),

  updateRolePermissions: (id: string, permissionIds: string[]) => apiFetch(`${ROLES_ENDPOINT}/${id}`, {
    method: 'PUT',
    body: {
      permission_ids: permissionIds,
    },
  }),

  inviteAdmin: (email: string) => apiFetch<InvitationResponse>(ADMIN_INVITATIONS_ENDPOINT, {
    method: 'POST',
    body: {
      email,
      role_code: 'admin',
    },
  }),
})

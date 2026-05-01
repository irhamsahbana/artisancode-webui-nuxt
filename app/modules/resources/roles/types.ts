import type { ApiResponse } from '~/types/api'

export type PermissionItem = {
  id: string
  name?: string
  description?: string
}

export type InvitationResponse = {
  id: string
  accept_token: string
  expires_at: string
}

export type RoleCreateForm = {
  name: string
  permissionIds: string[]
}

export type RoleEditForm = {
  id: string
  permissionIds: string[]
}

export type ApiFetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: Record<string, unknown>
  body?: BodyInit | Record<string, unknown> | null
  signal?: AbortSignal | null
  authMode?: 'user' | 'internal' | 'none'
}

export type ApiFetch = <T>(
  path: string,
  options?: ApiFetchOptions,
) => Promise<ApiResponse<T>>

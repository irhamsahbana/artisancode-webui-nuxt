import { flushPromises } from '@vue/test-utils'
import { computed, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createListResponse, createSuccessResponse } from '~/testing/api-response-fixtures'
import { mountComposable, stubTestDateTime, stubTestLocale } from '~/testing/component-test-utils'
import { useRolesManager } from './use-roles-manager'

const { apiFetch, show } = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  show: vi.fn(),
}))

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({ apiFetch }),
}))

vi.mock('~/composables/useBanner', () => ({
  useBanner: () => ({ show }),
}))

describe('useRolesManager', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    apiFetch.mockReset()
    show.mockReset()
    stubTestLocale()
    stubTestDateTime()
    vi.stubGlobal('useAuth', () => ({
      user: computed(() => ({
        roles: ['owner'],
      })),
    }))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('wires permission listing, role creation, and admin invite flows together', async () => {
    apiFetch.mockImplementation(async (path: string, options?: { method?: string, body?: Record<string, unknown>, query?: Record<string, unknown> }) => {
      if (path === '/role-and-permissions/permissions') {
        if (options?.query?.q === 'users') {
          return createListResponse([{ id: 'search_users', name: 'Search users' }])
        }

        return createListResponse([{ id: 'view_users', name: 'View users' }], { page: 1, lastPage: 2 })
      }

      if (path === '/role-and-permissions/roles' && options?.method === 'POST') {
        return createSuccessResponse(null)
      }

      if (path === '/user-invitations' && options?.method === 'POST') {
        return createSuccessResponse({
          id: 'invitation-1',
          accept_token: 'token value',
          expires_at: '2026-05-01T00:00:00Z',
        })
      }

      throw new Error(`Unhandled request: ${path}`)
    })

    const manager = mountComposable(() => useRolesManager())
    await flushPromises()

    expect(manager.permissions.value).toEqual([{ id: 'view_users', name: 'View users' }])
    expect(manager.canInviteAdmins.value).toBe(true)

    const startingListKey = manager.listKey.value
    await manager.openCreate()
    manager.createForm.name = '  Admin  '
    manager.togglePermission('view_users')
    await manager.submitCreate()

    expect(apiFetch).toHaveBeenCalledWith('/role-and-permissions/roles', {
      method: 'POST',
      body: {
        name: 'Admin',
        permissions: ['view_users'],
      },
    })
    expect(manager.listKey.value).toBe(startingListKey + 1)
    expect(manager.createOpen.value).toBe(false)

    manager.permissionListQueryInput.value = ' users '
    await nextTick()
    vi.advanceTimersByTime(600)
    await flushPromises()

    expect(manager.permissions.value).toEqual([{ id: 'search_users', name: 'Search users' }])

    manager.openAdminInvite()
    manager.adminInviteEmail.value = ' admin@example.com '
    await manager.submitAdminInvite()

    expect(apiFetch).toHaveBeenCalledWith('/user-invitations', {
      method: 'POST',
      body: {
        email: 'admin@example.com',
        role_code: 'admin',
      },
    })
    expect(manager.adminInviteResult.value?.accept_token).toBe('token value')
    expect(show).toHaveBeenCalledWith('ui.roleCreated', 'success')
    expect(show).toHaveBeenCalledWith('ui.adminInvitationCreatedSuccessfully', 'success')
  })

  it('hides admin invite action when the active user is not an owner', async () => {
    vi.stubGlobal('useAuth', () => ({
      user: computed(() => ({
        roles: ['admin'],
      })),
    }))
    apiFetch.mockResolvedValue(createListResponse([]))

    const manager = mountComposable(() => useRolesManager())
    await flushPromises()

    expect(manager.canInviteAdmins.value).toBe(false)
  })
})

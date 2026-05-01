import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountComposable, stubTestLocale } from '~/testing/component-test-utils'
import { useInternalClientOwnerPermissions } from './use-internal-client-owner-permissions'

const { apiFetch, show } = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  show: vi.fn(),
}))

describe('useInternalClientOwnerPermissions', () => {
  beforeEach(() => {
    apiFetch.mockReset()
    show.mockReset()
    stubTestLocale()
    vi.stubGlobal('useApi', () => ({ apiFetch }))
    vi.stubGlobal('useBanner', () => ({ show }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('blocks opening the dialog when client id is missing', async () => {
    const permissions = mountComposable(() => useInternalClientOwnerPermissions())

    await permissions.openPermissionDialog({})

    expect(show).toHaveBeenCalledWith('ui.clientIdIsMissing', 'error')
    expect(apiFetch).not.toHaveBeenCalled()
    expect(permissions.permissionDialogOpen.value).toBe(false)
  })

  it('loads permissions and resets loading when fetch throws', async () => {
    apiFetch.mockRejectedValueOnce(new Error('load failed'))
    const permissions = mountComposable(() => useInternalClientOwnerPermissions())

    await expect(permissions.openPermissionDialog({ id: 'client-1', name: 'Client A' })).rejects.toThrow('load failed')
    expect(permissions.permissionDialogLoading.value).toBe(false)
    expect(permissions.permissionDialogOpen.value).toBe(true)
  })

  it('toggles permissions and saves successfully', async () => {
    apiFetch
      .mockResolvedValueOnce({
        success: true,
        data: {
          client_id: 'client-1',
          available_permissions: [
            { id: 'perm-1', name: 'Owner.Read' },
            { id: 'perm-2', name: 'Owner.Write' },
          ],
          owner_permission_ids: ['perm-1'],
        },
      })
      .mockResolvedValueOnce({ success: true })

    const permissions = mountComposable(() => useInternalClientOwnerPermissions())

    await permissions.openPermissionDialog({ id: 'client-1', name: 'Client A' })
    permissions.togglePermission('perm-2')
    await permissions.saveOwnerPermissions()

    expect(apiFetch).toHaveBeenNthCalledWith(2, '/internal-clients/client-1/owner-permissions', {
      method: 'PUT',
      authMode: 'internal',
      body: {
        permission_ids: ['perm-1', 'perm-2'],
      },
    })
    expect(show).toHaveBeenCalledWith('ui.ownerPermissionsUpdated', 'success')
    expect(permissions.permissionDialogOpen.value).toBe(false)
    expect(permissions.permissionSaving.value).toBe(false)
  })
})

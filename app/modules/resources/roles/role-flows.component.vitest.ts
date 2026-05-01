import { flushPromises } from '@vue/test-utils'
import { computed, nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createListResponse, createSuccessResponse } from '~/testing/api-response-fixtures'
import { mountComposable } from '~/testing/component-test-utils'
import { useAdminInviteFlow } from './use-admin-invite-flow'
import { useRoleCreateFlow } from './use-role-create-flow'
import { useRoleEditFlow } from './use-role-edit-flow'

describe('role flows', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('loads, searches, and submits role creation through the extracted create flow', async () => {
    const show = vi.fn()
    const onCreated = vi.fn()
    const listPermissions = vi.fn(async (query: { page: number, limit: number, q?: string }) => {
      if (query.q) {
        return createListResponse([{ id: 'search_users', name: 'Search users' }], { page: 1, lastPage: 1 })
      }

      return createListResponse([{ id: 'view_users', name: 'View users' }], { page: 1, lastPage: 1 })
    })
    const createRole = vi.fn(async () => createSuccessResponse(null))

    const flow = mountComposable(() => useRoleCreateFlow({
      rolesApi: {
        listPermissions,
        createRole,
      } as never,
      searchDebounceMs: 10,
      show,
      t: (key) => key,
      onCreated,
    }))

    await flow.openDialog()

    expect(flow.open.value).toBe(true)
    expect(flow.filteredPermissions.value).toEqual([{ id: 'view_users', name: 'View users' }])

    flow.permissionQueryInput.value = ' users '
    await nextTick()
    vi.advanceTimersByTime(10)
    await flushPromises()

    expect(flow.filteredPermissions.value).toEqual([{ id: 'search_users', name: 'Search users' }])

    flow.form.name = '  Admin  '
    flow.togglePermission('search_users')
    await flow.submit()

    expect(createRole).toHaveBeenCalledWith('Admin', ['search_users'])
    expect(show).toHaveBeenCalledWith('ui.roleCreated', 'success')
    expect(onCreated).toHaveBeenCalledTimes(1)
    expect(flow.open.value).toBe(false)
    expect(flow.form.permissionIds).toEqual([])
  })

  it('syncs row state and submits permission edits through the extracted edit flow', async () => {
    const show = vi.fn()
    const ensureBasePermissions = vi.fn()
    const refreshList = vi.fn(async () => {})
    const closeDialog = vi.fn()
    const updateRolePermissions = vi.fn(async () => createSuccessResponse(null))
    const basePermissions = ref<Array<{ id: string, name?: string }>>([])

    const flow = mountComposable(() => useRoleEditFlow({
      rolesApi: {
        listPermissions: vi.fn(async () => createListResponse([])),
        updateRolePermissions,
      } as never,
      basePermissions: computed(() => basePermissions.value),
      searchDebounceMs: 10,
      show,
      t: (key) => key,
      ensureBasePermissions,
    }))

    const synced = flow.syncForm({
      id: 'role-1',
      permissions: [
        { id: 'view_users', name: 'View users' },
        { id: 'edit_users', name: 'Edit users' },
      ],
    })

    expect(synced).toBe(true)
    expect(flow.form.id).toBe('role-1')
    expect(flow.form.permissionIds).toEqual(['view_users', 'edit_users'])
    expect(ensureBasePermissions).toHaveBeenCalledTimes(1)

    flow.togglePermission('edit_users')
    await flow.submit(closeDialog, refreshList)

    expect(updateRolePermissions).toHaveBeenCalledWith('role-1', ['view_users'])
    expect(show).toHaveBeenCalledWith('ui.roleUpdated', 'success')
    expect(refreshList).toHaveBeenCalledTimes(1)
    expect(closeDialog).toHaveBeenCalledTimes(1)
    expect(flow.form.id).toBe('')
  })

  it('trims invite input and exposes the computed invitation link through the admin invite flow', async () => {
    const show = vi.fn()
    const inviteAdmin = vi.fn(async () => createSuccessResponse({
      id: 'invitation-1',
      accept_token: 'token value',
      expires_at: '2026-05-01T00:00:00Z',
    }))

    const flow = mountComposable(() => useAdminInviteFlow({
      appOrigin: computed(() => 'https://app.example.test'),
      rolesApi: {
        inviteAdmin,
      } as never,
      show,
      t: (key) => key,
      formatReadableDateTime: (value, _options, fallback) => value ?? fallback ?? '-',
    }))

    flow.openDialog()
    flow.email.value = ' admin@example.com '
    await flow.submit()

    expect(inviteAdmin).toHaveBeenCalledWith('admin@example.com')
    expect(flow.invitationLink.value).toBe('https://app.example.test/auth/invitation?token=token%20value')
    expect(flow.formatInvitationDateTime(flow.result.value?.expires_at)).toBe('2026-05-01T00:00:00Z')
    expect(show).toHaveBeenCalledWith('ui.adminInvitationCreatedSuccessfully', 'success')
  })

  it('resets loading state when create, edit, or invite requests throw', async () => {
    const createFlow = mountComposable(() => useRoleCreateFlow({
      rolesApi: {
        listPermissions: vi.fn(async () => createListResponse([{ id: 'view_users', name: 'View users' }])),
        createRole: vi.fn(async () => {
          throw new Error('create failed')
        }),
      } as never,
      searchDebounceMs: 10,
      show: vi.fn(),
      t: (key) => key,
      onCreated: vi.fn(),
    }))

    await createFlow.openDialog()
    createFlow.form.name = 'Admin'
    await expect(createFlow.submit()).rejects.toThrow('create failed')
    expect(createFlow.loading.value).toBe(false)

    const editFlow = mountComposable(() => useRoleEditFlow({
      rolesApi: {
        listPermissions: vi.fn(async () => createListResponse([])),
        updateRolePermissions: vi.fn(async () => {
          throw new Error('update failed')
        }),
      } as never,
      basePermissions: computed(() => []),
      searchDebounceMs: 10,
      show: vi.fn(),
      t: (key) => key,
      ensureBasePermissions: vi.fn(),
    }))

    editFlow.syncForm({
      id: 'role-1',
      permissions: [{ id: 'view_users', name: 'View users' }],
    })
    await expect(editFlow.submit(vi.fn(), vi.fn(async () => {}))).rejects.toThrow('update failed')
    expect(editFlow.loading.value).toBe(false)

    const inviteFlow = mountComposable(() => useAdminInviteFlow({
      appOrigin: computed(() => 'https://app.example.test'),
      rolesApi: {
        inviteAdmin: vi.fn(async () => {
          throw new Error('invite failed')
        }),
      } as never,
      show: vi.fn(),
      t: (key) => key,
      formatReadableDateTime: (value, _options, fallback) => value ?? fallback ?? '-',
    }))

    inviteFlow.openDialog()
    inviteFlow.email.value = 'admin@example.com'
    await expect(inviteFlow.submit()).rejects.toThrow('invite failed')
    expect(inviteFlow.loading.value).toBe(false)
  })

  it('resets permission loading when the create dialog permission fetch throws', async () => {
    const flow = mountComposable(() => useRoleCreateFlow({
      rolesApi: {
        listPermissions: vi.fn(async () => {
          throw new Error('permissions failed')
        }),
        createRole: vi.fn(),
      } as never,
      searchDebounceMs: 10,
      show: vi.fn(),
      t: (key) => key,
      onCreated: vi.fn(),
    }))

    await expect(flow.openDialog()).rejects.toThrow('permissions failed')
    expect(flow.permissionsLoading.value).toBe(false)
  })
})

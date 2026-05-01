import { flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFailureResponse, createListResponse } from '~/testing/api-response-fixtures'
import { mountComposable } from '~/testing/component-test-utils'
import { useRolePermissionList } from './use-role-permission-list'

vi.mock('#app', async () => {
  const { ref } = await import('vue')

  return {
    useAsyncData: (_key: string, handler: () => Promise<unknown>) => {
      const data = ref()
      const pending = ref(false)
      const error = ref<unknown | null>(null)

      const run = async () => {
        pending.value = true

        try {
          data.value = await handler()
          error.value = null
        }
        catch (caughtError) {
          error.value = caughtError
        }
        finally {
          pending.value = false
        }
      }

      void run()

      return {
        data,
        pending,
        error,
        refresh: run,
      }
    },
  }
})

describe('useRolePermissionList', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('handles pagination, debounced search, and keeps the last successful response on failed refreshes', async () => {
    const listPermissions = vi.fn(async (query: { page: number, limit: number, q?: string }) => {
      if (query.q === 'users') {
        return createListResponse([{ id: 'search_users', name: 'Search users' }], { page: 1, lastPage: 1 })
      }

      if (query.q === 'broken') {
        return createFailureResponse()
      }

      if (query.page === 2) {
        return createListResponse([{ id: 'edit_users', name: 'Edit users' }], { page: 2, lastPage: 2 })
      }

      return createListResponse([{ id: 'view_users', name: 'View users' }], { page: 1, lastPage: 2 })
    })

    const permissionList = mountComposable(() => useRolePermissionList({
      rolesApi: {
        listPermissions,
      } as never,
      searchDebounceMs: 10,
    }))

    await flushPromises()

    expect(permissionList.permissions.value).toEqual([{ id: 'view_users', name: 'View users' }])
    expect(permissionList.permissionCurrentPage.value).toBe(1)
    expect(permissionList.permissionLastPage.value).toBe(2)

    permissionList.nextPermissionPage()
    await flushPromises()

    expect(permissionList.permissions.value).toEqual([{ id: 'edit_users', name: 'Edit users' }])
    expect(permissionList.permissionCurrentPage.value).toBe(2)

    permissionList.permissionListQueryInput.value = ' users '
    await nextTick()
    vi.advanceTimersByTime(10)
    await flushPromises()

    expect(permissionList.permissions.value).toEqual([{ id: 'search_users', name: 'Search users' }])
    expect(permissionList.permissionCurrentPage.value).toBe(1)
    expect(permissionList.permissionLastPage.value).toBe(1)

    permissionList.permissionListQueryInput.value = ' broken '
    await nextTick()
    vi.advanceTimersByTime(10)
    await flushPromises()

    expect(permissionList.permissions.value).toEqual([{ id: 'search_users', name: 'Search users' }])
    expect(permissionList.permissionCurrentPage.value).toBe(1)
    expect(permissionList.permissionLastPage.value).toBe(1)
  })
})

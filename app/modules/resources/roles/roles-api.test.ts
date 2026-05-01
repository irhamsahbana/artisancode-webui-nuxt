import assert from 'node:assert/strict'
import test from 'node:test'

const { createRolesApi } = await import(new URL('./roles-api.ts', import.meta.url).href)

test('createRolesApi delegates role endpoints with the expected payload shapes', async () => {
  const calls: Array<{ path: string, options?: Record<string, unknown> }> = []
  const apiFetch = async <T>(path: string, options?: Record<string, unknown>) => {
    calls.push({ path, options })
    return {
      success: true,
      message: 'ok',
      data: null as T,
      errors: null,
    }
  }

  const rolesApi = createRolesApi(apiFetch)
  const signal = new AbortController().signal

  await rolesApi.listPermissions({ page: 2, limit: 15, q: 'users' }, signal)
  await rolesApi.createRole('Admin', ['view_users'])
  await rolesApi.updateRolePermissions('role-1', ['edit_users'])
  await rolesApi.inviteAdmin('admin@example.com')

  assert.deepEqual(calls, [
    {
      path: '/role-and-permissions/permissions',
      options: {
        query: { page: 2, limit: 15, q: 'users' },
        signal,
      },
    },
    {
      path: '/role-and-permissions/roles',
      options: {
        method: 'POST',
        body: {
          name: 'Admin',
          permissions: ['view_users'],
        },
      },
    },
    {
      path: '/role-and-permissions/roles/role-1',
      options: {
        method: 'PUT',
        body: {
          permission_ids: ['edit_users'],
        },
      },
    },
    {
      path: '/user-invitations',
      options: {
        method: 'POST',
        body: {
          email: 'admin@example.com',
          role_code: 'admin',
        },
      },
    },
  ])
})

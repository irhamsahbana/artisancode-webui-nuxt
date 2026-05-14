import assert from 'node:assert/strict'
import test from 'node:test'

const {
  fetchPermissionsByQuery,
} = await import(new URL('./role-permissions.ts', import.meta.url).href)
const {
  createFailureResponse,
  createListResponse,
} = await import(new URL('../../../../testing/api-response-fixtures.ts', import.meta.url).href)

type PermissionFixture = {
  id: string
}

type PermissionQuery = {
  page: number
  limit: number
  q: string
}

test('fetches all permission pages for a non-empty query', async () => {
  const queries: PermissionQuery[] = []
  const rolesApi = {
    listPermissions: async (query: PermissionQuery) => {
      queries.push(query)
      return query.page === 1
        ? createListResponse([{ id: 'view_users' }], { page: 1, perPage: 100, lastPage: 2 })
        : createListResponse([{ id: 'edit_users' }], { page: 2, perPage: 100, lastPage: 2 })
    },
  }

  assert.deepEqual(await fetchPermissionsByQuery(rolesApi, ' users '), [
    { id: 'view_users' },
    { id: 'edit_users' },
  ])
  assert.deepEqual(queries, [
    { page: 1, limit: 100, q: 'users' },
    { page: 2, limit: 100, q: 'users' },
  ])
})

test('skips permission search for empty query and stops on failed response', async () => {
  let calls = 0
  const rolesApi = {
    listPermissions: async () => {
      calls += 1
      return createFailureResponse()
    },
  }

  assert.deepEqual(await fetchPermissionsByQuery(rolesApi, '   '), [])
  assert.equal(calls, 0)
  assert.deepEqual(await fetchPermissionsByQuery(rolesApi, 'users'), [])
  assert.equal(calls, 1)
})

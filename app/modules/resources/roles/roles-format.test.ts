import assert from 'node:assert/strict'
import test from 'node:test'

const {
  buildAdminInvitationLink,
  buildRoleCreatePayload,
  buildRoleUpdatePayload,
  extractPermissionItemsFromRow,
  formatRoleDeleteLabel,
  formatRolePermissionCount,
  mergePermissionsById,
  toggleId,
} = await import(new URL('./roles-format.ts', import.meta.url).href)

test('formats role labels and permission counts defensively', () => {
  assert.equal(formatRoleDeleteLabel({ id: 'role-1', name: 'Owner' }), 'Owner')
  assert.equal(formatRoleDeleteLabel({ id: 'role-1', name: '' }), 'role-1')
  assert.equal(formatRolePermissionCount([{ id: 'a' }, { id: 'b' }]), '2')
  assert.equal(formatRolePermissionCount(null), '0')
})

test('toggles selected permission ids without mutating the source array', () => {
  const selected = ['a', 'b']

  assert.deepEqual(toggleId(selected, 'b'), ['a'])
  assert.deepEqual(toggleId(selected, 'c'), ['a', 'b', 'c'])
  assert.deepEqual(selected, ['a', 'b'])
})

test('extracts valid permission items from a resource row', () => {
  assert.deepEqual(extractPermissionItemsFromRow({
    permissions: [
      { id: 'view_users', name: 'View users', description: 'Can view users' },
      { id: 100, name: 'Invalid' },
      null,
      { id: 'edit_users' },
    ],
  }), [
    { id: 'view_users', name: 'View users', description: 'Can view users' },
    { id: 'edit_users', name: undefined, description: undefined },
  ])
})

test('merges permission groups by id while preserving first occurrence order', () => {
  assert.deepEqual(mergePermissionsById(
    [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
    [{ id: 'b', name: 'B updated' }, { id: 'c', name: 'C' }],
  ), [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
    { id: 'c', name: 'C' },
  ])
})

test('builds stable role and invitation payload helpers', () => {
  assert.deepEqual(buildRoleCreatePayload('  Admin  ', ['view_users']), {
    name: 'Admin',
    permissions: ['view_users'],
  })
  assert.deepEqual(buildRoleUpdatePayload(['view_users']), {
    permission_ids: ['view_users'],
  })
  assert.equal(
    buildAdminInvitationLink('https://app.example.test', 'token with spaces'),
    'https://app.example.test/auth/invitation?token=token%20with%20spaces',
  )
  assert.equal(buildAdminInvitationLink('', 'token'), '')
})

import { describe, expect, it } from 'vitest'
import { mountWithRoleStubs } from '~/testing/component-test-utils'
import AdminInviteDialog from './admin-invite-dialog.vue'
import RoleCreateDialog from './role-create-dialog.vue'
import RoleEditPermissionsDialog from './role-edit-permissions-dialog.vue'

const permissions = [
  {
    id: 'view_users',
    name: 'View users',
    description: 'Can view users',
  },
  {
    id: 'edit_users',
    name: 'Edit users',
    description: 'Can edit users',
  },
]

const mountCreateDialog = (overrides = {}) => mountWithRoleStubs(RoleCreateDialog, {
  props: {
    open: true,
    loading: false,
    roleName: 'Admin',
    selectedPermissionIds: ['view_users'],
    permissions,
    permissionsLoading: false,
    permissionQuery: '',
    permissionSkeletonRows: 2,
    showPagination: true,
    currentPage: 1,
    lastPage: 2,
    ...overrides,
  },
})

const mountEditDialog = (overrides = {}) => mountWithRoleStubs(RoleEditPermissionsDialog, {
  props: {
    loading: false,
    saving: false,
    permissions,
    selectedPermissionIds: ['view_users'],
    permissionQuery: '',
    ...overrides,
  },
})

const mountAdminInviteDialog = (overrides = {}) => mountWithRoleStubs(AdminInviteDialog, {
  props: {
    open: true,
    loading: false,
    email: 'admin@example.com',
    result: null,
    invitationLink: '',
    formatExpiresAt: (value: string | null | undefined) => value ? `formatted:${value}` : '-',
    ...overrides,
  },
})

describe('RoleCreateDialog', () => {
  it('does not render while closed', () => {
    const wrapper = mountCreateDialog({ open: false })

    expect(wrapper.find('[data-testid="role-create-dialog"]').exists()).toBe(false)
  })

  it('emits public events for form, permissions, pagination, and submit actions', async () => {
    const wrapper = mountCreateDialog()

    await wrapper.find('[data-testid="role-name-input"]').setValue('Owner')
    await wrapper.find('[data-testid="permission-search"]').setValue('users')
    await wrapper.find('[data-testid="permission-checkbox-edit_users"]').trigger('change')
    await wrapper.find('[data-testid="role-create-next"]').trigger('click')
    await wrapper.find('[data-testid="role-create-submit"]').trigger('click')
    await wrapper.find('[data-testid="role-create-close"]').trigger('click')

    expect(wrapper.emitted('update:roleName')).toEqual([['Owner']])
    expect(wrapper.emitted('update:permissionQuery')).toEqual([['users']])
    expect(wrapper.emitted('togglePermission')).toEqual([['edit_users']])
    expect(wrapper.emitted('nextPage')).toHaveLength(1)
    expect(wrapper.emitted('submit')).toHaveLength(1)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})

describe('RoleEditPermissionsDialog', () => {
  it('renders loading state instead of the picker while loading', () => {
    const wrapper = mountEditDialog({ loading: true })

    expect(wrapper.text()).toContain('ui.loading2')
    expect(wrapper.find('[data-testid="permission-search"]').exists()).toBe(false)
  })

  it('emits permission updates and save actions', async () => {
    const wrapper = mountEditDialog()

    await wrapper.find('[data-testid="permission-search"]').setValue('edit')
    await wrapper.find('[data-testid="permission-checkbox-edit_users"]').trigger('change')
    await wrapper.find('[data-testid="role-edit-save"]').trigger('click')

    expect(wrapper.emitted('update:permissionQuery')).toEqual([['edit']])
    expect(wrapper.emitted('togglePermission')).toEqual([['edit_users']])
    expect(wrapper.emitted('save')).toHaveLength(1)
  })
})

describe('AdminInviteDialog', () => {
  it('does not render while closed', () => {
    const wrapper = mountAdminInviteDialog({ open: false })

    expect(wrapper.find('[data-testid="admin-invite-dialog"]').exists()).toBe(false)
  })

  it('emits email updates and submit/close actions', async () => {
    const wrapper = mountAdminInviteDialog()

    await wrapper.find('[data-testid="admin-invite-email"]').setValue('owner@example.com')
    await wrapper.find('[data-testid="admin-invite-submit"]').trigger('click')
    await wrapper.find('[data-testid="admin-invite-cancel"]').trigger('click')

    expect(wrapper.emitted('update:email')).toEqual([['owner@example.com']])
    expect(wrapper.emitted('submit')).toHaveLength(1)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('renders invitation result and emits copy actions', async () => {
    const wrapper = mountAdminInviteDialog({
      invitationLink: 'https://app.example.test/auth/invitation?token=abc',
      result: {
        id: 'invitation-1',
        accept_token: 'abc',
        expires_at: '2026-05-01T00:00:00Z',
      },
    })

    expect(wrapper.text()).toContain('formatted:2026-05-01T00:00:00Z')

    await wrapper.find('[data-testid="admin-copy-token"]').trigger('click')
    await wrapper.find('[data-testid="admin-copy-link"]').trigger('click')

    expect(wrapper.emitted('copy')).toEqual([
      ['abc', 'ui.invitationTokenCopied'],
      ['https://app.example.test/auth/invitation?token=abc', 'ui.invitationLinkCopied'],
    ])
  })
})

import { describe, expect, it } from 'vitest'
import { mountWithRoleStubs } from '~/testing/component-test-utils'
import RolePermissionPicker from './role-permission-picker.vue'

const mountPicker = (overrides = {}) => mountWithRoleStubs(RolePermissionPicker, {
  props: {
    query: '',
    permissions: [
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
    ],
    selectedIds: ['view_users'],
    ...overrides,
  },
})

describe('RolePermissionPicker', () => {
  it('renders permissions and selected state from props', () => {
    const wrapper = mountPicker()
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    const firstCheckbox = checkboxes.at(0)
    const secondCheckbox = checkboxes.at(1)

    expect(wrapper.text()).toContain('View users')
    expect(wrapper.text()).toContain('Can edit users')
    expect((firstCheckbox?.element as HTMLInputElement | undefined)?.checked).toBe(true)
    expect((secondCheckbox?.element as HTMLInputElement | undefined)?.checked).toBe(false)
  })

  it('emits query updates when typing in the search input', async () => {
    const wrapper = mountPicker()

    await wrapper.find('input:not([type="checkbox"])').setValue('users')

    expect(wrapper.emitted('update:query')).toEqual([['users']])
  })

  it('emits the permission id when a checkbox changes', async () => {
    const wrapper = mountPicker()

    await wrapper.findAll('input[type="checkbox"]').at(1)?.trigger('change')

    expect(wrapper.emitted('togglePermission')).toEqual([['edit_users']])
  })

  it('renders an empty state when no permission matches', () => {
    const wrapper = mountPicker({ permissions: [] })

    expect(wrapper.text()).toContain('ui.noPermissionsFound')
  })
})

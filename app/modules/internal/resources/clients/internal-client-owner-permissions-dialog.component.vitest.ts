import { describe, expect, it } from 'vitest'
import { ButtonStub } from '~/testing/component-stubs'
import { mountWithRoleStubs } from '~/testing/component-test-utils'
import InternalClientOwnerPermissionsDialog from './internal-client-owner-permissions-dialog.vue'

const FormDialogShellStub = {
  name: 'FormDialogShell',
  props: {
    title: {
      type: String,
      required: true,
    },
  },
  template: `
    <section data-testid="owner-permissions-dialog">
      <h2>{{ title }}</h2>
      <slot />
      <slot name="footer" />
    </section>
  `,
}

const mountDialog = (overrides: Record<string, unknown> = {}) => mountWithRoleStubs(InternalClientOwnerPermissionsDialog, {
  props: {
    open: true,
    loading: false,
    saving: false,
    clientName: 'Client A',
    permissions: [
      { id: 'perm-1', name: 'Owner.Read', description: 'Read access' },
      { id: 'perm-2', name: 'Owner.Write', description: 'Write access' },
    ],
    selectedPermissionIds: ['perm-1'],
    ...overrides,
  },
  global: {
    stubs: {
      Button: ButtonStub,
      FormDialogShell: FormDialogShellStub,
    },
  },
})

describe('InternalClientOwnerPermissionsDialog', () => {
  it('renders title, selected client name, and empty state branches', () => {
    const wrapper = mountDialog()
    const emptyWrapper = mountDialog({ permissions: [] })

    expect(wrapper.get('[data-testid="owner-permissions-dialog"]').text()).toContain('ui.editOwnerPermissions')
    expect(wrapper.text()).toContain('Client A')
    expect(wrapper.text()).toContain('Owner.Read')
    expect(emptyWrapper.text()).toContain('ui.noPermissionsAvailable')
  })

  it('emits toggle, close, and save actions', async () => {
    const wrapper = mountDialog()

    await wrapper.findAll('input[type="checkbox"]')[1]?.trigger('change')
    await wrapper.findAll('button')[0]?.trigger('click')
    await wrapper.findAll('button')[1]?.trigger('click')

    expect(wrapper.emitted('togglePermission')).toEqual([['perm-2']])
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('save')).toHaveLength(1)
  })
})

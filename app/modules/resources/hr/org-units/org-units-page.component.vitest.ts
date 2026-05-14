import { mount } from '@vue/test-utils'
import { defineComponent, h, reactive, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import OrgUnitsPage from './org-units-page.vue'

const pageMocks = vi.hoisted(() => ({
  closeCreate: vi.fn(),
  openCreate: vi.fn(),
  submitCreate: vi.fn(),
}))

const createForm = reactive({
  name: 'People Ops',
  category: 'department',
  parent_id: 'ou-1',
})

vi.mock('./use-org-unit-parent-options', () => ({
  useOrgUnitParentOptions: () => ({
    fetchParentOptions: vi.fn(),
    parentOptions: ref([{ value: 'ou-1', label: 'Head Office' }]),
  }),
}))

vi.mock('./use-org-unit-create-flow', () => ({
  useOrgUnitCreateFlow: () => ({
    closeCreate: pageMocks.closeCreate,
    createForm,
    createLoading: ref(false),
    createOpen: ref(true),
    openCreate: pageMocks.openCreate,
    submitCreate: pageMocks.submitCreate,
  }),
}))

const ResourceListStub = defineComponent({
  name: 'ResourceList',
  props: {
    title: { type: String, default: '' },
    endpoint: { type: String, default: '' },
    columns: { type: Array, default: () => [] },
  },
  setup(props, { slots }) {
    return () => h('div', { 'data-testid': 'resource-list' }, [
      h('div', { 'data-testid': 'resource-list-title' }, props.title),
      h('div', { 'data-testid': 'resource-list-endpoint' }, props.endpoint),
      slots['header-actions']?.(),
    ])
  },
})

const FormDialogShellStub = defineComponent({
  name: 'FormDialogShell',
  props: {
    title: { type: String, default: '' },
  },
  emits: ['close'],
  setup(props, { emit, slots }) {
    return () => h('div', { 'data-testid': 'form-dialog-shell' }, [
      h('div', { 'data-testid': 'form-dialog-title' }, props.title),
      h('button', {
        'data-testid': 'form-dialog-close',
        onClick: () => emit('close'),
      }),
      slots.default?.(),
      slots.footer?.(),
    ])
  },
})

const OrgUnitDetailFormStub = defineComponent({
  name: 'OrgUnitDetailForm',
  props: {
    name: { type: String, default: '' },
    category: { type: String, default: '' },
    parentId: { type: String, default: '' },
    categoryOptions: { type: Array, default: () => [] },
    parentOptions: { type: Array, default: () => [] },
  },
  emits: ['update:name', 'update:category', 'update:parentId'],
  setup(props, { emit }) {
    return () => h('div', {
      'data-testid': 'org-unit-detail-form',
      'data-name': props.name,
      'data-category': props.category,
      'data-parent-id': props.parentId,
      'data-category-options': String(props.categoryOptions.length),
      'data-parent-options': String(props.parentOptions.length),
    }, [
      h('button', {
        'data-testid': 'update-name',
        onClick: () => emit('update:name', 'Updated Name'),
      }),
      h('button', {
        'data-testid': 'update-category',
        onClick: () => emit('update:category', 'unit'),
      }),
      h('button', {
        'data-testid': 'update-parent-id',
        onClick: () => emit('update:parentId', 'ou-2'),
      }),
    ])
  },
})

describe('OrgUnitsPage', () => {
  it('wires the create dialog to the extracted form and create flow', async () => {
    const wrapper = mount(OrgUnitsPage, {
      global: {
        stubs: {
          FormDialogShell: FormDialogShellStub,
          OrgUnitDetailForm: OrgUnitDetailFormStub,
          ResourceList: ResourceListStub,
        },
      },
    })

    expect(wrapper.get('[data-testid="resource-list-title"]').text()).toBe('ui.organizationUnits')
    expect(wrapper.get('[data-testid="resource-list-endpoint"]').text()).toBe('/org-units')
    expect(wrapper.get('[data-testid="form-dialog-title"]').text()).toBe('ui.createOrganizationUnit')
    expect(wrapper.get('[data-testid="org-unit-detail-form"]').attributes('data-category-options')).toBe('4')
    expect(wrapper.get('[data-testid="org-unit-detail-form"]').attributes('data-parent-options')).toBe('1')

    await wrapper.get('[data-testid="update-name"]').trigger('click')
    await wrapper.get('[data-testid="update-category"]').trigger('click')
    await wrapper.get('[data-testid="update-parent-id"]').trigger('click')
    await wrapper.get('button[type="submit"]').trigger('submit')
    await wrapper.get('[data-testid="form-dialog-close"]').trigger('click')
    await wrapper.getComponent(FormDialogShellStub).vm.$emit('close')
    await wrapper.get('button').trigger('click')

    expect(createForm).toEqual({
      name: 'Updated Name',
      category: 'unit',
      parent_id: 'ou-2',
    })
    expect(pageMocks.closeCreate).toHaveBeenCalledTimes(2)
    expect(pageMocks.openCreate).toHaveBeenCalledTimes(1)
    expect(pageMocks.submitCreate).toHaveBeenCalledTimes(1)
  })
})

import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import BranchesPage from './branches-page.vue'

const pageMocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  show: vi.fn(),
  refreshList: vi.fn(async () => {}),
  closeDetail: vi.fn(),
}))

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    apiFetch: pageMocks.apiFetch,
  }),
}))

vi.mock('~/composables/useBanner', () => ({
  useBanner: () => ({
    show: pageMocks.show,
  }),
}))

const ResourceListStub = defineComponent({
  name: 'ResourceList',
  props: {
    title: { type: String, default: '' },
    endpoint: { type: String, default: '' },
  },
  setup(props, { slots }) {
    return () => h('div', { 'data-testid': 'resource-list' }, [
      h('div', { 'data-testid': 'resource-list-title' }, props.title),
      h('div', { 'data-testid': 'resource-list-endpoint' }, props.endpoint),
      slots['header-actions']?.(),
      slots.detail?.({
        row: {
          id: 'branch-1',
          name: 'Branch One',
          city: 'Makassar',
          status: 'active',
        },
        loading: false,
        close: pageMocks.closeDetail,
        refresh: pageMocks.refreshList,
      }),
    ])
  },
})

const BranchManageDialogStub = defineComponent({
  name: 'BranchManageDialog',
  props: {
    open: { type: Boolean, default: false },
    title: { type: String, default: '' },
    idPrefix: { type: String, default: '' },
    form: { type: Object, required: true },
    saving: { type: Boolean, default: false },
    statusOptions: { type: Array, default: () => [] },
  },
  emits: ['close', 'submit'],
  setup(props, { emit }) {
    return () => props.open
      ? h('div', {
          'data-testid': `${props.idPrefix}-dialog`,
          'data-title': props.title,
          'data-saving': String(props.saving),
          'data-status-options': String(props.statusOptions.length),
        }, [
          h('button', {
            'data-testid': `${props.idPrefix}-fill`,
            onClick: () => {
              const form = props.form as Record<string, string>
              form.name = props.idPrefix === 'branch' ? 'Edited Branch' : 'Created Branch'
              form.city = props.idPrefix === 'branch' ? 'Maros' : 'Gowa'
              form.status = 'planning'
            },
          }),
          h('button', {
            'data-testid': `${props.idPrefix}-submit`,
            onClick: () => emit('submit'),
          }),
        ])
      : null
  },
})

describe('BranchesPage', () => {
  it('renders localized resource and dialog titles', async () => {
    pageMocks.apiFetch.mockReset()
    pageMocks.show.mockReset()
    pageMocks.refreshList.mockClear()
    pageMocks.closeDetail.mockClear()

    const wrapper = mount(BranchesPage, {
      global: {
        stubs: {
          BranchManageDialog: BranchManageDialogStub,
          ResourceList: ResourceListStub,
        },
      },
    })

    expect(wrapper.get('[data-testid="resource-list-title"]').text()).toBe('ui.branches')
    expect(wrapper.get('[data-testid="resource-list-endpoint"]').text()).toBe('/branches')
    expect(wrapper.get('[data-testid="branch-dialog"]').attributes('data-title')).toBe('ui.editBranch')
    expect(wrapper.find('[data-testid="create-branch-dialog"]').exists()).toBe(false)

    await wrapper.get('button').trigger('click')

    expect(wrapper.get('[data-testid="create-branch-dialog"]').attributes('data-title')).toBe('ui.createBranch')
    expect(wrapper.get('[data-testid="create-branch-dialog"]').attributes('data-status-options')).toBe('5')
  })

  it('submits create and edit flows with localized banners', async () => {
    pageMocks.apiFetch.mockReset()
    pageMocks.show.mockReset()
    pageMocks.refreshList.mockClear()
    pageMocks.closeDetail.mockClear()
    pageMocks.apiFetch
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true })

    const wrapper = mount(BranchesPage, {
      global: {
        stubs: {
          BranchManageDialog: BranchManageDialogStub,
          ResourceList: ResourceListStub,
        },
      },
    })

    await wrapper.get('button').trigger('click')
    await wrapper.get('[data-testid="create-branch-fill"]').trigger('click')
    await wrapper.get('[data-testid="create-branch-submit"]').trigger('click')
    await wrapper.get('[data-testid="branch-fill"]').trigger('click')
    await wrapper.get('[data-testid="branch-submit"]').trigger('click')

    expect(pageMocks.apiFetch).toHaveBeenNthCalledWith(1, '/branches', {
      method: 'POST',
      body: {
        name: 'Created Branch',
        city: 'Gowa',
        status: 'planning',
      },
    })
    expect(pageMocks.apiFetch).toHaveBeenNthCalledWith(2, '/branches/branch-1', {
      method: 'PUT',
      body: {
        name: 'Edited Branch',
        city: 'Maros',
        status: 'planning',
      },
    })
    expect(pageMocks.show).toHaveBeenNthCalledWith(1, 'ui.branchCreated', 'success')
    expect(pageMocks.show).toHaveBeenNthCalledWith(2, 'ui.branchUpdated', 'success')
    expect(pageMocks.refreshList).toHaveBeenCalledTimes(1)
    expect(pageMocks.closeDetail).toHaveBeenCalledTimes(1)
  })
})

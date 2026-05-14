import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import CategoriesPage from './categories-page.vue'

const pageMocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  show: vi.fn(),
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
    columns: { type: Array, default: () => [] },
  },
  setup(props, { slots }) {
    return () => h('div', { 'data-testid': 'resource-list' }, [
      h('div', { 'data-testid': 'resource-list-title' }, props.title),
      h('div', { 'data-testid': 'resource-list-endpoint' }, props.endpoint),
      h('div', { 'data-testid': 'resource-list-column-labels' }, (props.columns as Array<{ label: string }>)
        .map(column => column.label)
        .join('|')),
      slots['header-actions']?.(),
    ])
  },
})

const ButtonStub = defineComponent({
  name: 'Button',
  emits: ['click'],
  setup(_props, { emit, slots }) {
    return () => h('button', { onClick: () => emit('click') }, slots.default?.())
  },
})

const FormDialogShellStub = defineComponent({
  name: 'FormDialogShell',
  props: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  setup(props, { slots }) {
    return () => h('div', { 'data-testid': 'form-dialog-shell' }, [
      h('div', { 'data-testid': 'form-dialog-title' }, props.title),
      h('div', { 'data-testid': 'form-dialog-description' }, props.description),
      slots.default?.(),
    ])
  },
})

const LabelStub = defineComponent({
  name: 'Label',
  setup(_props, { slots }) {
    return () => h('label', slots.default?.())
  },
})

const SearchableSelectStub = defineComponent({
  name: 'SearchableSelect',
  props: {
    placeholder: { type: String, default: '' },
    searchPlaceholder: { type: String, default: '' },
    options: { type: Array, default: () => [] },
  },
  setup(props) {
    return () => h('div', {
      'data-testid': 'searchable-select',
      'data-placeholder': props.placeholder,
      'data-search-placeholder': props.searchPlaceholder,
      'data-option-count': String((props.options as unknown[]).length),
    })
  },
})

const SearchableTreeSelectStub = defineComponent({
  name: 'SearchableTreeSelect',
  props: {
    placeholder: { type: String, default: '' },
    searchPlaceholder: { type: String, default: '' },
    items: { type: Array, default: () => [] },
    displayValue: { type: String, default: '' },
  },
  setup(props) {
    return () => h('div', {
      'data-testid': 'searchable-tree-select',
      'data-placeholder': props.placeholder,
      'data-search-placeholder': props.searchPlaceholder,
      'data-item-count': String((props.items as unknown[]).length),
      'data-display-value': props.displayValue,
    })
  },
})

describe('CategoriesPage', () => {
  it('renders localized resource labels and create dialog copy', async () => {
    pageMocks.apiFetch.mockReset()
    pageMocks.show.mockReset()
    pageMocks.apiFetch.mockResolvedValue({
      success: true,
      data: {
        items: [],
      },
    })

    const wrapper = mount(CategoriesPage, {
      props: {
        categoryGroup: 'customer_type',
      },
      global: {
        stubs: {
          Button: ButtonStub,
          FormDialogShell: FormDialogShellStub,
          Input: true,
          Label: LabelStub,
          ResourceList: ResourceListStub,
          SearchableSelect: SearchableSelectStub,
          SearchableTreeSelect: SearchableTreeSelectStub,
        },
      },
    })

    expect(wrapper.get('[data-testid="resource-list-title"]').text()).toBe('ui.customerTypes')
    expect(wrapper.get('[data-testid="resource-list-endpoint"]').text()).toBe('/categories?group=customer_type')
    expect(wrapper.get('[data-testid="resource-list-column-labels"]').text()).toBe(
      'common.name|ui.status',
    )

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="form-dialog-title"]').text()).toBe('ui.createCategory')
    expect(wrapper.get('[data-testid="form-dialog-description"]').text()).toBe(
      'ui.manageCategoryNamesAndStatusWithACleanerFormLayout',
    )
    expect(wrapper.text()).not.toContain('ui.parentId')
    expect(wrapper.attributes()).not.toContain('Parent ID')
    expect(wrapper.find('[data-testid="searchable-select"]').attributes('data-placeholder')).toBe('ui.selectStatus')
  })

  it('shows parent select and loads area parent options from the same category group', async () => {
    pageMocks.apiFetch.mockReset()
    pageMocks.show.mockReset()
    pageMocks.apiFetch.mockResolvedValue({
      success: true,
      data: {
        items: [
          { id: 'area-1', name: 'Makassar' },
          { id: 'area-2', name: 'Gowa' },
        ],
      },
    })

    const wrapper = mount(CategoriesPage, {
      props: {
        categoryGroup: 'area',
      },
      global: {
        stubs: {
          Button: ButtonStub,
          FormDialogShell: FormDialogShellStub,
          Input: true,
          Label: LabelStub,
          ResourceList: ResourceListStub,
          SearchableSelect: SearchableSelectStub,
          SearchableTreeSelect: SearchableTreeSelectStub,
        },
      },
    })

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="resource-list-column-labels"]').text()).toBe(
      'common.name|ui.parent|ui.status',
    )
    expect(pageMocks.apiFetch).toHaveBeenCalledWith('/categories?group=area', {
      query: {
        limit: 200,
        paginate: 200,
      },
    })
    expect(wrapper.text()).toContain('ui.parent')
    expect(wrapper.get('[data-testid="form-dialog-description"]').text()).toBe(
      'ui.manageCategoryNamesStatusAndParentWithACleanerFormLayout',
    )
    expect(wrapper.get('[data-testid="searchable-tree-select"]').attributes('data-placeholder')).toBe('ui.selectParent')
    expect(wrapper.get('[data-testid="searchable-tree-select"]').attributes('data-item-count')).toBe('2')
  })
})

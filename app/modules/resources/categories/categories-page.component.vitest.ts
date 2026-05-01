import { mount } from '@vue/test-utils'
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

describe('CategoriesPage', () => {
  it('renders localized resource labels and create dialog copy', async () => {
    pageMocks.apiFetch.mockReset()
    pageMocks.show.mockReset()

    const wrapper = mount(CategoriesPage, {
      global: {
        stubs: {
          Button: ButtonStub,
          Input: true,
          Label: true,
          ResourceList: ResourceListStub,
          SearchableSelect: true,
        },
      },
    })

    expect(wrapper.get('[data-testid="resource-list-title"]').text()).toBe('ui.categories')
    expect(wrapper.get('[data-testid="resource-list-endpoint"]').text()).toBe('/categories')
    expect(wrapper.get('[data-testid="resource-list-column-labels"]').text()).toBe(
      'common.name|ui.group|ui.status',
    )

    await wrapper.get('button').trigger('click')

    expect(wrapper.text()).toContain('ui.createCategory')
    expect(wrapper.text()).toContain('ui.close')
  })
})

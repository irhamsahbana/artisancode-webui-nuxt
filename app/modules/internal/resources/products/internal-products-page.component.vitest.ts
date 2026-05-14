import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import InternalProductsPage from './internal-products-page.vue'

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

vi.mock('~/composables/useDateTime', () => ({
  useDateTime: () => ({
    formatReadableDateTime: (value: string | null | undefined, _options?: Intl.DateTimeFormatOptions, fallback = '-') => (
      value == null || value === '' ? fallback : String(value)
    ),
  }),
}))

const ResourceListStub = defineComponent({
  name: 'ResourceList',
  props: {
    title: { type: String, default: '' },
    endpoint: { type: String, default: '' },
    columns: { type: Array, default: () => [] },
    extraQuery: { type: Object, default: () => ({}) },
    searchPlaceholder: { type: String, default: '' },
  },
  setup(props) {
    return () => h('div', { 'data-testid': 'resource-list' }, [
      h('div', { 'data-testid': 'resource-list-title' }, props.title),
      h('div', { 'data-testid': 'resource-list-endpoint' }, props.endpoint),
      h('div', { 'data-testid': 'resource-list-search-placeholder' }, props.searchPlaceholder),
      h('div', { 'data-testid': 'resource-list-column-labels' }, (props.columns as Array<{ label: string }>)
        .map(column => column.label)
        .join('|')),
      h('div', { 'data-testid': 'resource-list-updated-at' }, String(
        (props.columns as Array<{ key: string, format?: (value: unknown) => string }>)
          .find(column => column.key === 'updated_at')
          ?.format?.('2026-05-01T10:30:00Z'),
      )),
      h('div', { 'data-testid': 'resource-list-query-status' }, String(
        (props.extraQuery as Record<string, string>).status ?? '',
      )),
    ])
  },
})

describe('InternalProductsPage', () => {
  it('wires the resource list with localized product columns and filters', () => {
    pageMocks.apiFetch.mockReset()
    pageMocks.show.mockReset()

    const wrapper = mount(InternalProductsPage, {
      global: {
        stubs: {
          InternalProductManageDialog: true,
          InternalResourceFilterPanel: true,
          InternalResourceListControls: true,
          ResourceList: ResourceListStub,
          Button: true,
          Label: true,
          SearchableSelect: true,
        },
      },
    })

    expect(wrapper.get('[data-testid="resource-list-title"]').text()).toBe('ui.products')
    expect(wrapper.get('[data-testid="resource-list-endpoint"]').text()).toBe('/internal-products')
    expect(wrapper.get('[data-testid="resource-list-search-placeholder"]').text()).toBe('ui.searchProducts')
    expect(wrapper.get('[data-testid="resource-list-column-labels"]').text()).toBe(
      'common.code|common.name|ui.status|ui.updatedAt',
    )
    expect(wrapper.get('[data-testid="resource-list-updated-at"]').text()).toBe('2026-05-01T10:30:00Z')
    expect(wrapper.get('[data-testid="resource-list-query-status"]').text()).toBe('')
  })
})

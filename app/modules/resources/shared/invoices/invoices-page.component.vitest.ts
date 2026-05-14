import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import InvoicesPage from './invoices-page.vue'

const ResourceListStub = defineComponent({
  name: 'ResourceList',
  props: {
    title: { type: String, default: '' },
    endpoint: { type: String, default: '' },
    columns: { type: Array, default: () => [] },
    searchKey: { type: String, default: '' },
    loadingVariant: { type: String, default: '' },
    canDelete: { type: Boolean, default: true },
  },
  setup(props) {
    return () => h('div', { 'data-testid': 'resource-list' }, [
      h('div', { 'data-testid': 'resource-list-title' }, props.title),
      h('div', { 'data-testid': 'resource-list-endpoint' }, props.endpoint),
      h('div', { 'data-testid': 'resource-list-search-key' }, String(props.searchKey)),
      h('div', { 'data-testid': 'resource-list-loading-variant' }, props.loadingVariant),
      h('div', { 'data-testid': 'resource-list-can-delete' }, String(props.canDelete)),
      h('div', { 'data-testid': 'resource-list-column-labels' }, (props.columns as Array<{ label: string }>)
        .map(column => column.label)
        .join('|')),
      h('div', { 'data-testid': 'resource-list-amount-format' }, String(
        (props.columns as Array<{ key: string, format?: (value: unknown) => string }>)
          .find(column => column.key === 'amount')
          ?.format?.(125000),
      )),
    ])
  },
})

describe('InvoicesPage', () => {
  it('wires the invoices resource list with localized columns and formatting', () => {
    const wrapper = mount(InvoicesPage, {
      global: {
        stubs: {
          ResourceList: ResourceListStub,
        },
      },
    })

    expect(wrapper.get('[data-testid="resource-list-title"]').text()).toBe('ui.invoices')
    expect(wrapper.get('[data-testid="resource-list-endpoint"]').text()).toBe('/invoices')
    expect(wrapper.get('[data-testid="resource-list-search-key"]').text()).toBe('null')
    expect(wrapper.get('[data-testid="resource-list-loading-variant"]').text()).toBe('skeleton')
    expect(wrapper.get('[data-testid="resource-list-can-delete"]').text()).toBe('false')
    expect(wrapper.get('[data-testid="resource-list-column-labels"]').text()).toBe(
      'ui.invoiceNumber|ui.amount|ui.currency|ui.status|ui.invoiceDueAt',
    )
    expect(wrapper.get('[data-testid="resource-list-amount-format"]').text()).toMatch(/^Rp\s?125\.000$/)
  })
})

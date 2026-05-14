import { describe, expect, it } from 'vitest'
import { mountWithRoleStubs } from '~/testing/component-test-utils'
import PermissionsTableCard from './permissions-table-card.vue'

const mountCard = (overrides = {}) => mountWithRoleStubs(PermissionsTableCard, {
  props: {
    query: '',
    error: null,
    pending: false,
    permissions: [
      {
        id: 'view_users',
        name: 'View users',
        description: 'Can view users',
      },
    ],
    skeletonRows: 2,
    currentPage: 1,
    lastPage: 3,
    ...overrides,
  },
})

describe('PermissionsTableCard', () => {
  it('renders permission rows and emits search updates', async () => {
    const wrapper = mountCard()

    expect(wrapper.find('[data-testid="permissions-table-row-view_users"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Can view users')

    await wrapper.find('[data-testid="permissions-table-search"]').setValue('view')

    expect(wrapper.emitted('update:query')).toEqual([['view']])
  })

  it('renders loading skeletons while pending', () => {
    const wrapper = mountCard({ pending: true })

    expect(wrapper.findAll('[data-testid="permissions-table-skeleton-row"]')).toHaveLength(2)
  })

  it('renders error and empty states', () => {
    const errorWrapper = mountCard({ error: new Error('failed') })
    const emptyWrapper = mountCard({ permissions: [] })

    expect(errorWrapper.find('[data-testid="permissions-table-error"]').exists()).toBe(true)
    expect(emptyWrapper.find('[data-testid="permissions-table-empty"]').exists()).toBe(true)
  })

  it('emits pagination actions', async () => {
    const wrapper = mountCard({ currentPage: 2, lastPage: 3 })

    await wrapper.find('[data-testid="permissions-table-previous"]').trigger('click')
    await wrapper.find('[data-testid="permissions-table-next"]').trigger('click')

    expect(wrapper.emitted('previousPage')).toHaveLength(1)
    expect(wrapper.emitted('nextPage')).toHaveLength(1)
  })
})

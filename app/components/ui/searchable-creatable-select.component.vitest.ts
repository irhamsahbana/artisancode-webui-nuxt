import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SearchableCreatableSelect from './searchable-creatable-select.vue'

describe('SearchableCreatableSelect', () => {
  beforeEach(() => {
    vi.stubGlobal('useApi', () => ({
      apiFetch: vi.fn(),
    }))
    vi.stubGlobal('useBanner', () => ({
      show: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('loads the next API page on scroll and appends the options', async () => {
    const apiFetch = vi.fn()
      .mockResolvedValueOnce({
        success: true,
        message: '',
        data: {
          items: [
            { id: '1', name: 'Acme Alpha' },
            { id: '2', name: 'Acme Beta' },
          ],
          pagination: {
            total: 3,
            page: 1,
            per_page: 2,
            last_page: 2,
          },
        },
        errors: null,
      })
      .mockResolvedValueOnce({
        success: true,
        message: '',
        data: {
          items: [
            { id: '3', name: 'Acme Gamma' },
          ],
          pagination: {
            total: 3,
            page: 2,
            per_page: 2,
            last_page: 2,
          },
        },
        errors: null,
      })

    vi.stubGlobal('useApi', () => ({
      apiFetch,
    }))

    const wrapper = mount(SearchableCreatableSelect, {
      props: {
        fetchEndpoint: '/api/customer-companies',
      },
    })

    await wrapper.get('input').trigger('focus')
    await vi.waitFor(() => {
      expect(apiFetch).toHaveBeenCalledTimes(1)
      expect(wrapper.findAll('button[role="option"]')).toHaveLength(2)
    })
    await nextTick()
    expect((wrapper.vm as any).$?.setupState.currentPage).toBe(1)
    expect((wrapper.vm as any).$?.setupState.lastPage).toBe(2)
    expect((wrapper.vm as any).$?.setupState.hasNextPage).toBe(true)

    expect(apiFetch).toHaveBeenNthCalledWith(1, '/api/customer-companies', expect.objectContaining({
      query: expect.objectContaining({
        page: 1,
        paginate: 15,
      }),
    }))

    await (wrapper.vm as any).$?.setupState.loadOptions('', 2)
    await vi.waitFor(() => {
      expect(apiFetch).toHaveBeenCalledTimes(2)
    })

    expect(apiFetch).toHaveBeenNthCalledWith(2, '/api/customer-companies', expect.objectContaining({
      query: expect.objectContaining({
        page: 2,
        paginate: 15,
      }),
    }))

    const optionLabels = wrapper.findAll('button[role="option"]').map(node => node.text())
    expect(optionLabels).toEqual(['Acme Alpha', 'Acme Beta', 'Acme Gamma'])
  })

  it('passes the next page into custom fetchOptions handlers', async () => {
    const fetchOptions = vi.fn()
      .mockResolvedValueOnce({
        options: [
          { value: '1', label: 'North Branch' },
          { value: '2', label: 'South Branch' },
        ],
        pagination: {
          page: 1,
          last_page: 2,
        },
      })
      .mockResolvedValueOnce({
        options: [
          { value: '3', label: 'West Branch' },
        ],
        pagination: {
          page: 2,
          last_page: 2,
        },
      })

    const wrapper = mount(SearchableCreatableSelect, {
      props: {
        fetchOptions,
      },
    })

    await wrapper.get('input').trigger('focus')
    await vi.waitFor(() => {
      expect(fetchOptions).toHaveBeenCalledTimes(1)
      expect(wrapper.findAll('button[role="option"]')).toHaveLength(2)
    })
    await nextTick()
    expect((wrapper.vm as any).$?.setupState.currentPage).toBe(1)
    expect((wrapper.vm as any).$?.setupState.lastPage).toBe(2)
    expect((wrapper.vm as any).$?.setupState.hasNextPage).toBe(true)

    await (wrapper.vm as any).$?.setupState.loadOptions('', 2)
    await vi.waitFor(() => {
      expect(fetchOptions).toHaveBeenCalledTimes(2)
    })

    expect(fetchOptions).toHaveBeenNthCalledWith(1, '', 1)
    expect(fetchOptions).toHaveBeenNthCalledWith(2, '', 2)

    const optionLabels = wrapper.findAll('button[role="option"]').map(node => node.text())
    expect(optionLabels).toEqual(['North Branch', 'South Branch', 'West Branch'])
  })
})

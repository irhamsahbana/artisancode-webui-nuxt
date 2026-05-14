import { describe, expect, it, vi } from 'vitest'
import {
  createCustomerCompanyOption,
  fetchCustomerCompanyOptions,
} from './customer-company-options'

describe('customer company options', () => {
  it('maps category items into selectable options', async () => {
    const apiFetch = vi.fn(async () => ({
      success: true,
      data: {
        items: [
          { id: 'cat-1', name: 'PT Arunika Karya' },
          { id: 'cat-2', name: 'CV Laut Timur' },
          { id: null, name: 'Ignored' },
        ],
        meta: {
          page: 1,
          paginate: 15,
          total_data: 17,
          total_page: 2,
        },
      },
    }))

    const result = await fetchCustomerCompanyOptions(apiFetch as never, 'aru')

    expect(apiFetch).toHaveBeenCalledWith('/categories?group=customer_company', {
      query: {
        q: 'aru',
        page: 1,
        paginate: 15,
        limit: 15,
      },
    })
    expect(result).toEqual({
      options: [
        { value: 'cat-1', label: 'PT Arunika Karya' },
        { value: 'cat-2', label: 'CV Laut Timur' },
      ],
      pagination: {
        page: 1,
        per_page: 15,
        total: 17,
        last_page: 2,
      },
    })
  })

  it('creates a customer company category with active status', async () => {
    const apiFetch = vi.fn(async () => ({
      success: true,
      data: {
        id: 'cat-9',
      },
    }))

    const result = await createCustomerCompanyOption(apiFetch as never, 'PT Baru Sentosa')

    expect(apiFetch).toHaveBeenCalledWith('/categories?group=customer_company', {
      method: 'POST',
      body: {
        name: 'PT Baru Sentosa',
        status: 'active',
        parent_id: null,
      },
    })
    expect(result).toEqual({
      value: 'cat-9',
      label: 'PT Baru Sentosa',
    })
  })
})

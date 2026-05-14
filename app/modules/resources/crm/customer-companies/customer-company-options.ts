import type { PaginationMeta } from '~/types/api'
import { getCrmCategoryEndpoint } from '../categories/crm-category-groups'

type CategoryOptionItem = {
  id?: string | number | null
  name?: string | null
}

type CategoryListMeta = {
  page?: number
  paginate?: number
  total_data?: number
  total_page?: number
}

type CustomerCompanyOption = {
  value: string
  label: string
}

const CUSTOMER_COMPANY_GROUP = 'customer_company'
const CUSTOMER_COMPANY_ENDPOINT = getCrmCategoryEndpoint(CUSTOMER_COMPANY_GROUP)

const mapCategoryItemToOption = (item: CategoryOptionItem) => {
  if (item.id == null) {
    return null
  }

  const label = String(item.name ?? '').trim()
  if (!label) {
    return null
  }

  return {
    value: String(item.id),
    label,
  } satisfies CustomerCompanyOption
}

export const fetchCustomerCompanyOptions = async (
  apiFetch: ReturnType<typeof useApi>['apiFetch'],
  query: string,
  page = 1,
) => {
  const response = await apiFetch<{ items?: CategoryOptionItem[], pagination?: PaginationMeta, meta?: CategoryListMeta }>(CUSTOMER_COMPANY_ENDPOINT, {
    query: {
      q: query.trim() || undefined,
      page,
      paginate: 15,
      limit: 15,
    },
  })

  if (!response.success || !response.data) {
    return []
  }

  const pagination = response.data.pagination ?? (
    response.data.meta
      ? {
          page: response.data.meta.page ?? page,
          per_page: response.data.meta.paginate ?? 15,
          total: response.data.meta.total_data ?? response.data.items?.length ?? 0,
          last_page: response.data.meta.total_page ?? page,
        } satisfies PaginationMeta
      : null
  )

  return {
    options: (response.data.items ?? [])
      .map(mapCategoryItemToOption)
      .filter((item): item is CustomerCompanyOption => item !== null),
    pagination: pagination ?? {
      page,
      per_page: 15,
      total: response.data.items?.length ?? 0,
      last_page: page,
    },
  }
}

export const createCustomerCompanyOption = async (
  apiFetch: ReturnType<typeof useApi>['apiFetch'],
  query: string,
) => {
  const name = query.trim()
  if (!name) {
    return null
  }

  const response = await apiFetch<{ id?: string | number | null }>(CUSTOMER_COMPANY_ENDPOINT, {
    method: 'POST',
    body: {
      name,
      status: 'active',
      parent_id: null,
    },
  })

  if (!response.success) {
    return null
  }

  return {
    value: response.data?.id == null ? name : String(response.data.id),
    label: name,
  } satisfies CustomerCompanyOption
}

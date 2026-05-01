type PaginationOptions = {
  lastPage?: number
  page?: number
  perPage?: number
  total?: number
}

export const createListResponse = <T>(
  items: T[],
  options: PaginationOptions = {},
) => ({
  success: true,
  message: 'ok',
  data: {
    items,
    pagination: {
      total: options.total ?? items.length,
      page: options.page ?? 1,
      per_page: options.perPage ?? 15,
      last_page: options.lastPage ?? 1,
    },
  },
  errors: null,
})

export const createSuccessResponse = <T>(data: T) => ({
  success: true,
  message: 'ok',
  data,
  errors: null,
})

export const createFailureResponse = (message = 'failed') => ({
  success: false,
  message,
  data: null,
  errors: {
    general: [message],
  },
})

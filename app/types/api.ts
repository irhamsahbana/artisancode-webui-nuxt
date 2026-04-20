export interface ApiResponseMeta {
  status?: number
  retryAfterSeconds?: number | null
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
  errors: unknown
  meta?: ApiResponseMeta
}

export interface PaginationMeta {
  total: number
  page: number
  per_page: number
  last_page: number
}

export interface ListResponse<T> {
  items: T[]
  pagination: PaginationMeta
}

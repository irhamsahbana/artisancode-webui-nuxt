type InternalProductListFilterState = {
  status: string
}

type InternalProductColumn = {
  key: string
  label: string
  format?: (value: unknown) => string
}

type InternalProductActionItem = {
  key: string
  label: string
  kind: 'export' | 'export-history'
}

type InternalProductListDeps = {
  t: (key: string) => string
  formatReadableDateTime: (
    value: string | null | undefined,
    options?: Intl.DateTimeFormatOptions,
    fallback?: string,
  ) => string
}

export const buildInternalProductListQuery = (filters: InternalProductListFilterState) => {
  const query: Record<string, string> = {}

  if (filters.status) {
    query.status = filters.status
  }

  return query
}

export const createInternalProductActionItems = (): InternalProductActionItem[] => ([
  {
    key: 'export-products',
    label: 'ui.export',
    kind: 'export',
  },
  {
    key: 'product-export-history',
    label: 'ui.exportHistory',
    kind: 'export-history',
  },
])

export const createInternalProductColumns = ({
  t,
  formatReadableDateTime,
}: InternalProductListDeps): InternalProductColumn[] => ([
  { key: 'code', label: t('common.code') },
  { key: 'name', label: t('common.name') },
  { key: 'status', label: t('ui.status') },
  {
    key: 'updated_at',
    label: t('ui.updatedAt'),
    format: (value: unknown) => {
      if (typeof value !== 'string' || !value) {
        return '-'
      }

      return formatReadableDateTime(value, undefined, '-')
    },
  },
])

export const formatInternalProductDeleteLabel = (row: Record<string, unknown>) => {
  const name = row.name
  const code = row.code

  if (typeof name === 'string' && name.length > 0 && typeof code === 'string' && code.length > 0) {
    return `${name} (${code})`
  }

  return typeof name === 'string' && name.length > 0 ? name : String(row.id ?? '-')
}

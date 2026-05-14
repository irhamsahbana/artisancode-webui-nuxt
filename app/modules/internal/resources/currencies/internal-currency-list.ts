type InternalCurrencyColumn = {
  key: string
  label: string
  format?: (value: unknown) => string | { label: string; class?: string }
}

type InternalCurrencyListDeps = {
  t: (key: string) => string
}

export const createInternalCurrencyColumns = ({
  t,
}: InternalCurrencyListDeps): InternalCurrencyColumn[] => ([
  { key: 'code', label: t('billingSettings.currencies.columns.code') },
  { key: 'name', label: t('billingSettings.currencies.columns.name') },
  { key: 'symbol', label: t('billingSettings.currencies.columns.symbol') },
  { key: 'decimal_places', label: t('billingSettings.currencies.columns.decimalPlaces') },
  {
    key: 'is_active',
    label: t('billingSettings.currencies.columns.status'),
    format: (value: unknown) => ({
      label: value ? t('billingSettings.currencies.filters.active') : t('billingSettings.currencies.filters.inactive'),
      class: value ? 'border-emerald-200 text-emerald-700' : 'border-slate-200 text-slate-600',
    }),
  },
  {
    key: 'is_default',
    label: t('billingSettings.currencies.columns.default'),
    format: (value: unknown) => ({
      label: value ? t('billingSettings.currencies.defaultBadge') : '-',
      class: value ? '' : '',
    }),
  },
])

export const formatInternalCurrencyDeleteLabel = (row: Record<string, unknown>) => {
  const name = row.name
  const code = row.code

  if (typeof name === 'string' && name.length > 0 && typeof code === 'string' && code.length > 0) {
    return `${name} (${code})`
  }

  return typeof code === 'string' && code.length > 0 ? code : String(row.id ?? '-')
}

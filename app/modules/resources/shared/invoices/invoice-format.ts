export const formatInvoiceCurrency = (value: unknown, currency = 'IDR') => {
  const amount = typeof value === 'number' ? value : Number(value)

  if (Number.isNaN(amount)) {
    return '-'
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
  }).format(amount)
}

type TranslationFn = (key: string) => string

export const createInvoiceColumns = (t: TranslationFn) => [
  { key: 'invoice_number', label: t('ui.invoiceNumber') },
  {
    key: 'amount',
    label: t('ui.amount'),
    format: (value: unknown) => formatInvoiceCurrency(value),
  },
  { key: 'currency', label: t('ui.currency') },
  { key: 'status', label: t('ui.status') },
  { key: 'due_date', label: t('ui.invoiceDueAt') },
]

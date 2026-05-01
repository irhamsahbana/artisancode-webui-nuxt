import { describe, expect, it } from 'vitest'
import { createInvoiceColumns, formatInvoiceCurrency } from './invoice-format'

describe('invoice-format', () => {
  it('formats invoice currency defensively', () => {
    expect(formatInvoiceCurrency(15000)).toMatch(/^Rp\s?15\.000$/)
    expect(formatInvoiceCurrency('2000')).toMatch(/^Rp\s?2\.000$/)
    expect(formatInvoiceCurrency('invalid')).toBe('-')
  })

  it('builds localized invoice columns', () => {
    const columns = createInvoiceColumns((key) => key)

    expect(columns.map(column => column.label)).toEqual([
      'ui.invoiceNumber',
      'ui.amount',
      'ui.currency',
      'ui.status',
      'ui.invoiceDueAt',
    ])
    expect(columns[1]?.format?.(125000)).toMatch(/^Rp\s?125\.000$/)
  })
})

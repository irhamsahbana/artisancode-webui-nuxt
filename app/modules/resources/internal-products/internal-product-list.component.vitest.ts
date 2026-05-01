import { describe, expect, it } from 'vitest'
import {
  buildInternalProductListQuery,
  createInternalProductActionItems,
  createInternalProductColumns,
  formatInternalProductDeleteLabel,
} from './internal-product-list'

describe('internalProductList', () => {
  it('builds a query only when the status filter is present', () => {
    expect(buildInternalProductListQuery({ status: '' })).toEqual({})
    expect(buildInternalProductListQuery({ status: 'active' })).toEqual({ status: 'active' })
  })

  it('creates localized columns and formats updated timestamps', () => {
    const columns = createInternalProductColumns({
      t: key => `t:${key}`,
      formatReadableDateTime: value => `date:${value}`,
    })

    expect(columns.map(column => column.label)).toEqual([
      't:common.code',
      't:common.name',
      't:ui.status',
      't:ui.updatedAt',
    ])
    expect(columns.find(column => column.key === 'updated_at')?.format?.('2026-05-01T10:30:00Z')).toBe(
      'date:2026-05-01T10:30:00Z',
    )
    expect(columns.find(column => column.key === 'updated_at')?.format?.('')).toBe('-')
  })

  it('provides export action items for the shared list controls', () => {
    expect(createInternalProductActionItems()).toEqual([
      { key: 'export-products', label: 'ui.export', kind: 'export' },
      { key: 'product-export-history', label: 'ui.exportHistory', kind: 'export-history' },
    ])
  })

  it('formats delete labels with name and code when available', () => {
    expect(formatInternalProductDeleteLabel({ id: 'prod-1', name: 'Alpha', code: 'A-1' })).toBe('Alpha (A-1)')
    expect(formatInternalProductDeleteLabel({ id: 'prod-1', name: 'Alpha' })).toBe('Alpha')
    expect(formatInternalProductDeleteLabel({ id: 'prod-1' })).toBe('prod-1')
  })
})

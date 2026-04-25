import assert from 'node:assert/strict'
import test from 'node:test'

const {
  formatDateOnlyValue,
  formatReadableDateTimeValue,
  isIsoDateOnly,
  isIsoDateTime,
  parseIsoDateTime,
} = await import(new URL('./date-time.ts', import.meta.url).href)

test('recognizes ISO date-only values', () => {
  assert.equal(isIsoDateOnly('2026-01-01'), true)
  assert.equal(isIsoDateOnly('2026/01/01'), false)
})

test('recognizes datetime values from HTML input and PostgreSQL timestamps', () => {
  assert.equal(isIsoDateTime('2026-01-01T00:00'), true)
  assert.equal(isIsoDateTime('2026-01-01T00:00:00Z'), true)
  assert.equal(isIsoDateTime('2026-01-01 00:00:00+00'), true)
  assert.equal(isIsoDateTime('2026-01-01 00:00:00+0000'), true)
  assert.equal(isIsoDateTime('01-01-2026 00:00:00'), false)
})

test('parses PostgreSQL timestamps with timezone offsets', () => {
  assert.equal(
    parseIsoDateTime('2026-01-01 00:00:00+00')?.toISOString(),
    '2026-01-01T00:00:00.000Z',
  )

  assert.equal(
    parseIsoDateTime('2026-01-01 00:00:00+0000')?.toISOString(),
    '2026-01-01T00:00:00.000Z',
  )
})

test('formats readable datetime values for Indonesian locale', () => {
  const formatted = formatReadableDateTimeValue('2026-01-01 00:00:00+00', 'id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })

  assert.ok(formatted)
  assert.match(formatted, /01/)
  assert.match(formatted, /2026/)
  assert.match(formatted, /00[.:]00/)
})

test('formats date-only values with UTC-safe rendering', () => {
  const formatted = formatDateOnlyValue('2026-01-01', 'en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  assert.equal(formatted, 'January 01, 2026')
})

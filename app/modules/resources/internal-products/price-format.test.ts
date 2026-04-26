import assert from 'node:assert/strict'
import test from 'node:test'

const {
  formatMoneyAmount,
  formatPriceAmountInput,
  isPriceAmountDraftValid,
  normalizeLocalizedPriceAmountInput,
  normalizePriceAmountInput,
} = await import(new URL('../../../utils/price-format.ts', import.meta.url).href)

test('normalizes amount input into backend-safe numeric strings', () => {
  assert.equal(normalizePriceAmountInput('00123'), '123')
  assert.equal(normalizePriceAmountInput('3,1312312312addas'), '3.131231')
  assert.equal(normalizePriceAmountInput('199.000'), '199.000')
  assert.equal(normalizePriceAmountInput('abc'), '')
})

test('formats amount input using Indonesian separators', () => {
  assert.equal(formatPriceAmountInput('199000', 'id'), '199.000')
  assert.equal(formatPriceAmountInput('1234567.89', 'id'), '1.234.567,89')
  assert.equal(formatPriceAmountInput('14.', 'id'), '14,')
})

test('formats amount input using English separators', () => {
  assert.equal(formatPriceAmountInput('199000', 'en'), '199,000')
  assert.equal(formatPriceAmountInput('1234567.89', 'en'), '1,234,567.89')
  assert.equal(formatPriceAmountInput('14.', 'en'), '14.')
})

test('normalizes localized amount input without treating group separators as decimals', () => {
  assert.equal(normalizeLocalizedPriceAmountInput('2.131.231', 'id'), '2131231')
  assert.equal(normalizeLocalizedPriceAmountInput('1.234', 'id'), '1234')
  assert.equal(normalizeLocalizedPriceAmountInput('1.234.567,89', 'id'), '1234567.89')
  assert.equal(normalizeLocalizedPriceAmountInput('1,234,567.89', 'en'), '1234567.89')
  assert.equal(normalizeLocalizedPriceAmountInput('14,', 'id'), '14.')
  assert.equal(normalizeLocalizedPriceAmountInput('14.', 'en'), '14.')
})

test('accepts dot as a decimal separator for Indonesian decimal drafts', () => {
  assert.equal(normalizeLocalizedPriceAmountInput('14.', 'id'), '14.')
  assert.equal(normalizeLocalizedPriceAmountInput('14.5', 'id'), '14.5')
  assert.equal(normalizeLocalizedPriceAmountInput('14.25', 'id'), '14.25')
  assert.equal(isPriceAmountDraftValid('14.5', 'id'), true)
})

test('validates draft amount input before formatting', () => {
  assert.equal(isPriceAmountDraftValid('3213213', 'id'), true)
  assert.equal(isPriceAmountDraftValid('2.131.231', 'id'), true)
  assert.equal(isPriceAmountDraftValid('3213213,12', 'id'), true)
  assert.equal(isPriceAmountDraftValid('3,2132131sdada', 'id'), false)
  assert.equal(isPriceAmountDraftValid('3,213,213', 'id'), false)
})

test('formats money amount with reusable currency formatter', () => {
  assert.equal(formatMoneyAmount('150000.00', 'IDR', 'id'), 'Rp 150.000')
  assert.equal(formatMoneyAmount('150000.50', 'IDR', 'en'), 'IDR 150,000.50')
  assert.equal(formatMoneyAmount('abc', 'IDR', 'id'), '-')
})

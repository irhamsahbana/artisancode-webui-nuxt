export const normalizePriceAmountInput = (value: string) => {
  const cleaned = value.replace(/[^\d.,]/g, '')
  if (!cleaned) {
    return ''
  }

  const lastSeparatorIndex = Math.max(cleaned.lastIndexOf('.'), cleaned.lastIndexOf(','))
  const integerPart = (lastSeparatorIndex >= 0 ? cleaned.slice(0, lastSeparatorIndex) : cleaned).replace(/[^\d]/g, '')
  const decimalPart = lastSeparatorIndex >= 0
    ? cleaned.slice(lastSeparatorIndex + 1).replace(/[^\d]/g, '').slice(0, 6)
    : ''

  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, '') || '0'
  return decimalPart ? `${normalizedInteger}.${decimalPart}` : normalizedInteger
}

const resolveAmountSeparators = (locale: string) => (
  locale.startsWith('en')
    ? { group: ',', decimal: '.' }
    : { group: '.', decimal: ',' }
)

const escapeForRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const resolveDecimalSeparatorForInput = (cleaned: string, locale: string) => {
  const { decimal } = resolveAmountSeparators(locale)
  if (locale.startsWith('en')) {
    return decimal
  }

  const commaCount = cleaned.split(',').length - 1
  if (commaCount > 0) {
    return ','
  }

  const dotCount = cleaned.split('.').length - 1
  if (dotCount !== 1) {
    return decimal
  }

  const [, decimalDraft = ''] = cleaned.split('.')
  return decimalDraft.length === 3 ? decimal : '.'
}

export const normalizeLocalizedPriceAmountInput = (value: string, locale: string) => {
  const { group } = resolveAmountSeparators(locale)
  const cleaned = value.replace(/[^\d.,]/g, '')

  if (!cleaned) {
    return ''
  }

  const decimal = resolveDecimalSeparatorForInput(cleaned, locale)
  const effectiveGroup = decimal === '.' ? ',' : group
  const effectiveGroupPattern = new RegExp(escapeForRegex(effectiveGroup), 'g')
  const decimalPattern = new RegExp(escapeForRegex(decimal), 'g')
  const decimalMatches = cleaned.match(decimalPattern) ?? []
  const [integerRaw = '', ...decimalRawParts] = cleaned.split(decimal)
  const integerPart = integerRaw.replace(effectiveGroupPattern, '').replace(/[^\d]/g, '')
  const decimalPart = decimalMatches.length > 0
    ? decimalRawParts.join('').replace(effectiveGroupPattern, '').replace(/[^\d]/g, '').slice(0, 6)
    : ''

  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, '') || '0'
  if (decimalMatches.length > 0 && !decimalPart) {
    return `${normalizedInteger}.`
  }

  return decimalPart ? `${normalizedInteger}.${decimalPart}` : normalizedInteger
}

export const isPriceAmountDraftValid = (value: string, locale: string) => {
  if (!/^[\d.,]*$/.test(value)) {
    return false
  }

  const cleaned = value.replace(/[^\d.,]/g, '')
  const decimal = resolveDecimalSeparatorForInput(cleaned, locale)
  const decimalCount = value.split(decimal).length - 1
  return decimalCount <= 1
}

export const formatPriceAmountInput = (value: string, locale: string) => {
  const normalized = normalizePriceAmountInput(value)
  if (!normalized) {
    return ''
  }

  const { group, decimal } = resolveAmountSeparators(locale)
  const hasTrailingDecimal = /[.,]$/.test(value)
  const [integerPart = '', decimalPart] = normalized.split('.')
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, group)

  if (hasTrailingDecimal) {
    return `${groupedInteger}${decimal}`
  }

  return decimalPart
    ? `${groupedInteger}${decimal}${decimalPart}`
    : groupedInteger
}

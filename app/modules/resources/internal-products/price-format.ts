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

export const normalizeLocalizedPriceAmountInput = (value: string, locale: string) => {
  const { group, decimal } = resolveAmountSeparators(locale)
  const groupPattern = new RegExp(escapeForRegex(group), 'g')
  const decimalPattern = new RegExp(escapeForRegex(decimal), 'g')
  const cleaned = value.replace(/[^\d.,]/g, '')

  if (!cleaned) {
    return ''
  }

  const decimalMatches = cleaned.match(decimalPattern) ?? []
  const [integerRaw = '', ...decimalRawParts] = cleaned.split(decimal)
  const integerPart = integerRaw.replace(groupPattern, '').replace(/[^\d]/g, '')
  const decimalPart = decimalMatches.length > 0
    ? decimalRawParts.join('').replace(groupPattern, '').replace(/[^\d]/g, '').slice(0, 6)
    : ''

  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, '') || '0'
  return decimalPart ? `${normalizedInteger}.${decimalPart}` : normalizedInteger
}

export const isPriceAmountDraftValid = (value: string, locale: string) => {
  if (!/^[\d.,]*$/.test(value)) {
    return false
  }

  const { decimal } = resolveAmountSeparators(locale)
  const decimalCount = value.split(decimal).length - 1
  return decimalCount <= 1
}

export const formatPriceAmountInput = (value: string, locale: string) => {
  const normalized = normalizePriceAmountInput(value)
  if (!normalized) {
    return ''
  }

  const { group, decimal } = resolveAmountSeparators(locale)
  const [integerPart = '', decimalPart] = normalized.split('.')
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, group)

  return decimalPart
    ? `${groupedInteger}${decimal}${decimalPart}`
    : groupedInteger
}

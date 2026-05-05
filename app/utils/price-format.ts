export const normalizePriceAmountInput = (value: string, maxDecimalPlaces: number = 6) => {
  const cleaned = value.replace(/[^\d.,]/g, '')
  if (!cleaned) {
    return ''
  }

  const lastSeparatorIndex = Math.max(cleaned.lastIndexOf('.'), cleaned.lastIndexOf(','))
  const integerPart = (lastSeparatorIndex >= 0 ? cleaned.slice(0, lastSeparatorIndex) : cleaned).replace(/[^\d]/g, '')
  const decimalPart = lastSeparatorIndex >= 0
    ? cleaned.slice(lastSeparatorIndex + 1).replace(/[^\d]/g, '').slice(0, maxDecimalPlaces)
    : ''

  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, '') || '0'
  return decimalPart ? `${normalizedInteger}.${decimalPart}` : normalizedInteger
}

const resolveAmountSeparators = (locale: string) => (
  locale.startsWith('en')
    ? { group: '.', decimal: ',' }
    : { group: ',', decimal: '.' }
)

const escapeForRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const resolveDecimalSeparatorForInput = (cleaned: string, locale: string) => {
  const { decimal } = resolveAmountSeparators(locale)
  return decimal
}

export const normalizeLocalizedPriceAmountInput = (value: string, locale: string, maxDecimalPlaces: number = 6) => {
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
    ? decimalRawParts.join('').replace(effectiveGroupPattern, '').replace(/[^\d]/g, '').slice(0, maxDecimalPlaces)
    : ''

  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, '') || '0'
  if (decimalMatches.length > 0 && !decimalPart) {
    return `${normalizedInteger}.`
  }

  return decimalPart ? `${normalizedInteger}.${decimalPart}` : normalizedInteger
}

export const isPriceAmountDraftValid = (value: string, locale: string, maxDecimalPlaces: number = 6) => {
  if (!/^[\d.,]*$/.test(value)) {
    return false
  }

  const cleaned = value.replace(/[^\d.,]/g, '')
  const decimal = resolveDecimalSeparatorForInput(cleaned, locale)
  const decimalCount = value.split(decimal).length - 1
  if (decimalCount > 1) {
    return false
  }

  const decimalIndex = value.lastIndexOf(decimal)
  if (decimalIndex >= 0 && maxDecimalPlaces >= 0) {
    const decimalPart = value.slice(decimalIndex + 1).replace(/[^\d]/g, '')
    if (decimalPart.length > maxDecimalPlaces) {
      return false
    }
  }

  return true
}

export const formatPriceAmountInput = (value: string, locale: string) => {
  const normalized = /^\d+(?:\.\d*)?$/.test(value)
    ? value.replace(/^0+(?=\d)/, '')
    : normalizeLocalizedPriceAmountInput(value, locale)
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

export const formatMoneyAmount = (
  amount: string | number | null | undefined,
  currencyCode: string | null | undefined,
  locale: string,
  options: {
    maximumFractionDigits?: number
  } = {},
) => {
  const numericAmount = typeof amount === 'number' ? amount : Number(amount)
  const normalizedCurrency = currencyCode?.trim().toUpperCase() || 'IDR'

  if (!Number.isFinite(numericAmount)) {
    return '-'
  }

  const { group, decimal } = resolveAmountSeparators(locale)
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'id-ID', {
    style: 'currency',
    currency: normalizedCurrency,
    minimumFractionDigits: numericAmount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: options.maximumFractionDigits ?? (numericAmount % 1 === 0 ? 0 : 2),
  })
    .formatToParts(numericAmount)
    .map(part => {
      if (part.type === 'group') {
        return group
      }

      if (part.type === 'decimal') {
        return decimal
      }

      return part.value
    })
    .join('')
}

export type AppDateLocale = 'id-ID' | 'en-US'

const ISO_DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/

export const resolveDateLocale = (locale: string): AppDateLocale => (
  locale === 'en' ? 'en-US' : 'id-ID'
)

export const isIsoDateOnly = (value: string) => ISO_DATE_ONLY_PATTERN.test(value)

export const isIsoDateTime = (value: string) => ISO_DATE_TIME_PATTERN.test(value)

export const parseIsoDateOnly = (value: string) => {
  if (!isIsoDateOnly(value)) {
    return null
  }

  const year = Number.parseInt(value.slice(0, 4), 10)
  const month = Number.parseInt(value.slice(5, 7), 10)
  const day = Number.parseInt(value.slice(8, 10), 10)
  const date = new Date(Date.UTC(year, month - 1, day))
  return Number.isNaN(date.getTime()) ? null : date
}

export const parseIsoDateOnlyLocal = (value: string) => {
  if (!isIsoDateOnly(value)) {
    return null
  }

  const year = Number.parseInt(value.slice(0, 4), 10)
  const month = Number.parseInt(value.slice(5, 7), 10)
  const day = Number.parseInt(value.slice(8, 10), 10)
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? null : date
}

export const parseIsoDateOnlyForInput = (value: string) => {
  if (!value) {
    return null
  }

  const normalized = value.trim().slice(0, 10)
  return parseIsoDateOnly(normalized)
}

export const normalizeIsoDateInput = (value: string) => {
  if (!value) {
    return ''
  }

  const normalized = value.trim().slice(0, 10)
  return isIsoDateOnly(normalized) ? normalized : ''
}

export const parseIsoDateTime = (value: string) => {
  if (!isIsoDateTime(value)) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const formatDateOnlyValue = (
  value: string,
  locale: AppDateLocale,
  options?: Intl.DateTimeFormatOptions,
) => {
  const date = parseIsoDateOnlyForInput(value)
  if (!date) {
    return null
  }

  return date.toLocaleDateString(locale, {
    timeZone: 'UTC',
    ...(options ?? {}),
  })
}

export const formatDateTimeValue = (
  value: string,
  locale: AppDateLocale,
  options?: Intl.DateTimeFormatOptions,
) => {
  const date = parseIsoDateTime(value)
  if (!date) {
    return null
  }

  return date.toLocaleString(locale, options)
}

export const formatReadableDateTimeValue = (
  value: string,
  locale: AppDateLocale,
  options?: Intl.DateTimeFormatOptions,
) => formatDateTimeValue(value, locale, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  ...(options ?? {}),
})

export const formatIsoDateValue = (
  value: string,
  locale: AppDateLocale,
  {
    dateOnly,
    dateTime,
  }: {
    dateOnly?: Intl.DateTimeFormatOptions
    dateTime?: Intl.DateTimeFormatOptions
  } = {},
) => {
  if (isIsoDateOnly(value)) {
    return formatDateOnlyValue(value, locale, dateOnly)
  }

  if (isIsoDateTime(value)) {
    return formatDateTimeValue(value, locale, dateTime)
  }

  return null
}

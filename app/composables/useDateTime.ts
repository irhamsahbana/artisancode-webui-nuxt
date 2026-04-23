import {
  formatDateOnlyValue,
  formatDateTimeValue,
  formatIsoDateValue,
  formatReadableDateTimeValue,
  normalizeIsoDateInput,
  resolveDateLocale,
} from '~/utils/date-time'

export const useDateTime = () => {
  const { locale } = useLocale()

  const getIntlLocale = () => resolveDateLocale(locale.value)

  const formatDateOnly = (
    value: string | null | undefined,
    options?: Intl.DateTimeFormatOptions,
    fallback = '-',
  ) => {
    if (!value) {
      return fallback
    }

    return formatDateOnlyValue(value, getIntlLocale(), options) ?? value
  }

  const formatDateTime = (
    value: string | null | undefined,
    options?: Intl.DateTimeFormatOptions,
    fallback = '-',
  ) => {
    if (!value) {
      return fallback
    }

    return formatDateTimeValue(value, getIntlLocale(), options) ?? value
  }

  const formatReadableDateTime = (
    value: string | null | undefined,
    options?: Intl.DateTimeFormatOptions,
    fallback = '-',
  ) => {
    if (!value) {
      return fallback
    }

    return formatReadableDateTimeValue(value, getIntlLocale(), options) ?? value
  }

  const formatIsoDate = (
    value: string | null | undefined,
    options?: {
      dateOnly?: Intl.DateTimeFormatOptions
      dateTime?: Intl.DateTimeFormatOptions
    },
    fallback = '-',
  ) => {
    if (!value) {
      return fallback
    }

    return formatIsoDateValue(value, getIntlLocale(), options) ?? value
  }

  const normalizeDateInput = (value: string | null | undefined) => {
    if (!value) {
      return ''
    }

    return normalizeIsoDateInput(value)
  }

  return {
    formatDateOnly,
    formatDateTime,
    formatReadableDateTime,
    formatIsoDate,
    normalizeDateInput,
  }
}

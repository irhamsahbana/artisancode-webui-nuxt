import type { AppLocale } from '~/composables/useLocale'

type TimezoneOption = {
  value: string
  label: string
}

const timezoneOptionsByLocale: Record<AppLocale, TimezoneOption[]> = {
  id: [
    { value: 'Asia/Jakarta', label: 'WIB (Jakarta)' },
    { value: 'Asia/Makassar', label: 'WITA (Makassar)' },
    { value: 'Asia/Jayapura', label: 'WIT (Jayapura)' },
    { value: 'Asia/Singapore', label: 'GMT+8 (Singapura)' },
    { value: 'UTC', label: 'UTC' },
  ],
  en: [
    { value: 'Asia/Jakarta', label: 'WIB (Jakarta)' },
    { value: 'Asia/Makassar', label: 'WITA (Makassar)' },
    { value: 'Asia/Jayapura', label: 'WIT (Jayapura)' },
    { value: 'Asia/Singapore', label: 'GMT+8 (Singapore)' },
    { value: 'UTC', label: 'UTC' },
  ],
}

export const getTimezoneOptions = (locale: AppLocale): TimezoneOption[] =>
  timezoneOptionsByLocale[locale] ?? timezoneOptionsByLocale.en

export const getTimezoneLabel = (locale: AppLocale, timezone: string | null | undefined): string => {
  const value = timezone?.trim()
  if (!value) {
    return '-'
  }

  const matched = getTimezoneOptions(locale).find(option => option.value === value)
  return matched?.label ?? value
}

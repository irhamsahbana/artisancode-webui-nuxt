import { computed } from 'vue'
import { useI18n } from '#imports'
import { exactIdUiMessages } from '~/utils/raw-ui-messages'

export type AppLocale = 'id' | 'en'

type LocaleOption = {
  value: AppLocale
  label: string
}

const supportedLocales: AppLocale[] = ['id', 'en']

const normalizeUiTypography = (text: string) => text.replace(/\.\.\./g, '…')

const translateToken = (value: string) => {
  const normalized = value.trim().toLowerCase()
  return exactIdUiMessages[value.trim()] ?? exactIdUiMessages[normalized] ?? null
}

const translateRawIndonesian = (text: string): string => {
  const trimmed = normalizeUiTypography(text.trim())

  if (!trimmed) {
    return text
  }

  if (trimmed.endsWith(' *')) {
    return `${translateRawIndonesian(trimmed.slice(0, -2))} *`
  }

  if (trimmed.endsWith('*')) {
    return `${translateRawIndonesian(trimmed.slice(0, -1).trimEnd())} *`
  }

  const exact = exactIdUiMessages[trimmed]
  if (exact) {
    return exact
  }

  const dynamicPatterns: Array<[RegExp, (...matches: string[]) => string]> = [
    [/^(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})$/, (from, to) => `${from} s.d. ${to}`],
    [/^Attendance overview for (.+)$/, date => `Ringkasan kehadiran untuk ${date}`],
    [/^Last (\d+) days$/, days => `${days} hari terakhir`],
    [/^Checked in, checked out, late check in, and missing check out counts for the last (\d+) days\.$/, days => `Jumlah check-in, check-out, keterlambatan, dan tidak check-out untuk ${days} hari terakhir.`],
    [/^Review detailed logs for (.+)\.$/, date => `Tinjau log detail untuk ${date}.`],
    [/^(\d+) advanced filters active$/, count => `${count} filter lanjutan aktif`],
    [/^(\d+) filters active$/, count => `${count} filter aktif`],
    [/^(\d+) in queue$/, count => `${count} dalam antrean`],
    [/^(\d+) ready files$/, count => `${count} file siap`],
    [/^Attendance export queued as ([A-Z]+)\.$/, format => `Ekspor kehadiran dimasukkan antrean sebagai ${format}.`],
    [/^Export ([A-Z]+)$/, format => `Ekspor ${format}`],
  ]

  for (const [pattern, translate] of dynamicPatterns) {
    const match = trimmed.match(pattern)
    if (match) {
      return translate(...match.slice(1))
    }
  }

  const selectMatch = trimmed.match(/^Select (.+)$/)
  if (selectMatch) {
    const value = selectMatch[1] ?? ''
    const translated = translateToken(value) ?? value
    return `Pilih ${translated}`
  }

  const searchMatch = trimmed.match(/^Search (.+?)(\.\.\.|…)?$/)
  if (searchMatch) {
    const value = searchMatch[1] ?? ''
    const translated = translateToken(value) ?? value
    return normalizeUiTypography(`Cari ${translated}${searchMatch[2] ?? ''}`)
  }

  const allMatch = trimmed.match(/^All (.+)$/)
  if (allMatch) {
    const value = allMatch[1] ?? ''
    const translated = translateToken(value) ?? value
    return `Semua ${translated}`
  }

  return normalizeUiTypography(text)
}

export const useLocale = () => {
  const i18n = useI18n()

  const locale = computed<AppLocale>(() => {
    const value = String(i18n.locale.value)
    return supportedLocales.includes(value as AppLocale) ? value as AppLocale : 'id'
  })

  const setLocale = async (value: AppLocale) => {
    if (locale.value === value) {
      return
    }

    await i18n.setLocale(value)
  }

  const t = (key: string, params?: Record<string, string | number>) => (
    params ? i18n.t(key, params) : i18n.t(key)
  )

  const format = (key: string, params: Record<string, string | number>) => i18n.t(key, params)

  const text = (value: string, params?: Record<string, string | number>) => {
    const normalized = normalizeUiTypography(value)
    if (i18n.te(normalized)) {
      return params ? i18n.t(normalized, params) : i18n.t(normalized)
    }

    return locale.value === 'id' ? translateRawIndonesian(normalized) : normalized
  }

  const options = computed<LocaleOption[]>(() => [
    { value: 'id', label: t('common.indonesian') },
    { value: 'en', label: t('common.english') },
  ])

  return {
    locale,
    options,
    setLocale,
    t,
    format,
    text,
  }
}

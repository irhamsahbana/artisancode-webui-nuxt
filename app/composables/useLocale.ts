import { computed } from 'vue'
import { useI18n } from '#imports'

export type AppLocale = 'id' | 'en'

type LocaleOption = {
  value: AppLocale
  label: string
}

const supportedLocales: AppLocale[] = ['id', 'en']

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
  }
}

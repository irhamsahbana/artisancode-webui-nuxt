import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { vi } from 'vitest'
import { roleComponentStubs } from './component-stubs'

type LocaleFormat = (key: string, params?: Record<string, string>) => string
type LocaleTranslate = (key: string) => string
type LocalePath = <T>(value: T) => T
type DateTimeFormat = (
  value: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback?: string,
) => string
type DateOnlyFormat = (value: unknown) => string

type LocaleStubOptions = {
  format?: LocaleFormat
  localePath?: LocalePath
  t?: LocaleTranslate
}

type DateTimeStubOptions = {
  formatDateOnly?: DateOnlyFormat
  formatDateTime?: DateTimeFormat
  formatReadableDateTime?: DateTimeFormat
}

const defaultTranslate: LocaleTranslate = key => key
const defaultFormat: LocaleFormat = key => key
const defaultLocalePath: LocalePath = value => value
const defaultFormatDateOnly: DateOnlyFormat = value => `date:${String(value)}`
const defaultFormatDateTime: DateTimeFormat = (value, _options, fallback = '-') => (
  value == null || value === '' ? fallback : String(value)
)

export const stubTestLocale = (options: LocaleStubOptions = {}) => {
  vi.stubGlobal('useLocale', () => ({
    t: options.t ?? defaultTranslate,
    format: options.format ?? defaultFormat,
  }))
  vi.stubGlobal('useLocalePath', () => (options.localePath ?? defaultLocalePath))
}

export const stubTestDateTime = (options: DateTimeStubOptions = {}) => {
  vi.stubGlobal('useDateTime', () => ({
    formatDateOnly: options.formatDateOnly ?? defaultFormatDateOnly,
    formatDateTime: options.formatDateTime ?? defaultFormatDateTime,
    formatReadableDateTime: options.formatReadableDateTime ?? defaultFormatDateTime,
  }))
}

export const mountComposable = <T extends object>(factory: () => T) => {
  let exposed!: T

  mount(defineComponent({
    setup() {
      exposed = factory()
      return () => h('div')
    },
  }))

  return exposed
}

export const mountWithRoleStubs = (component: unknown, options: Record<string, any> = {}) => {
  return mount(component as any, {
    ...options,
    global: {
      ...options?.global,
      stubs: {
        ...roleComponentStubs,
        ...(typeof options?.global === 'object' && options.global?.stubs
          ? options.global.stubs
          : {}),
      },
    },
  } as any)
}

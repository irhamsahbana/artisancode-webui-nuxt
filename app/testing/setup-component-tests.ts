import { vi } from 'vitest'
import { stubTestDateTime, stubTestLocale } from './component-test-utils'

stubTestLocale()
stubTestDateTime({
  formatDateTime: (value: unknown) => `time:${String(value)}`,
})

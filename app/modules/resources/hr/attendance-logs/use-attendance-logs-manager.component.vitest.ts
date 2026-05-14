import { flushPromises } from '@vue/test-utils'
import { computed, nextTick, reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createListResponse } from '~/testing/api-response-fixtures'
import { mountComposable, stubTestDateTime, stubTestLocale } from '~/testing/component-test-utils'
import { useAttendanceLogsManager } from './use-attendance-logs-manager'

const { apiFetch, show } = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  show: vi.fn(),
}))

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({ apiFetch }),
}))

vi.mock('~/composables/useBanner', () => ({
  useBanner: () => ({ show }),
}))

describe('useAttendanceLogsManager', () => {
  const route = reactive<{ query: Record<string, unknown> }>({
    query: {
      status: 'recorded',
      page: '2',
    },
  })
  const replace = vi.fn(async ({ query }: { query: Record<string, unknown> }) => {
    route.query = query
  })

  beforeEach(() => {
    vi.useFakeTimers()
    apiFetch.mockReset()
    show.mockReset()
    replace.mockClear()
    route.query = {
      status: 'recorded',
      page: '2',
    }

    vi.stubGlobal('useRoute', () => route)
    vi.stubGlobal('useRouter', () => ({ replace }))
    stubTestLocale()
    stubTestDateTime()

    apiFetch.mockImplementation(async (path: string) => {
      if (path === '/employees') {
        return createListResponse([{ id: 'emp-1', employee_no: 'EMP001', full_name: 'Ayu Lestari' }])
      }

      if (path === '/org-units') {
        return createListResponse([{ id: 'ou-1', name: 'Engineering', category: 'department' }])
      }

      if (path === '/work-locations') {
        return createListResponse([{ id: 'wl-1', name: 'HQ' }])
      }

      if (path === '/export-jobs') {
        return createListResponse([])
      }

      throw new Error(`Unhandled request: ${path}`)
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('hydrates filters from the route, coordinates overlay state, and syncs filter changes back to query', async () => {
    const manager = mountComposable(() => useAttendanceLogsManager())
    await flushPromises()

    expect(manager.filters.status).toBe('recorded')
    expect(manager.filters.type).toBe('')
    expect(manager.columns.value.map(column => column.key)).toEqual([
      'employee_no',
      'employee_name',
      'type',
      'source',
      'status',
      'attendance_date',
      'logged_at',
      'selfie_url',
    ])
    expect(manager.columns.value[2]?.format?.('check_in', {})).toBe('Check In')
    expect(manager.columns.value[6]?.format?.('', {})).toBe('-')
    expect(manager.columns.value[7]?.format?.('https://example.test/selfie.jpg', {})).toBe('ui.available')
    expect(manager.filterPanelOptions.value.employeeOptions).toEqual([
      { value: '', label: 'ui.allEmployees' },
      { value: 'emp-1', label: 'Ayu Lestari (EMP001)' },
    ])
    expect(manager.filterPanelOptions.value.workLocationOptions).toEqual([
      { value: '', label: 'ui.allWorkLocations' },
      { value: 'wl-1', label: 'HQ' },
    ])

    manager.toggleExportMenu()
    expect(manager.exportMenuOpen.value).toBe(true)
    manager.toggleFilterPanel()
    expect(manager.filterPanelOpen.value).toBe(true)
    expect(manager.exportMenuOpen.value).toBe(false)
    manager.closeFilterPanel()
    expect(manager.filterPanelOpen.value).toBe(false)
    manager.toggleExportMenu()
    expect(manager.exportMenuOpen.value).toBe(true)
    manager.closeExportMenu()
    expect(manager.exportMenuOpen.value).toBe(false)

    manager.updateFilter('type', 'check_in')
    await nextTick()
    await flushPromises()

    expect(replace).toHaveBeenLastCalledWith({
      query: {
        page: '2',
        status: 'recorded',
        type: 'check_in',
      },
    })

    manager.clearFilters()
    await nextTick()
    await flushPromises()

    expect(replace).toHaveBeenLastCalledWith({
      query: {
        page: '2',
      },
    })
  })

  it('loads supporting data on mount and applies date presets deterministically', async () => {
    vi.setSystemTime(new Date('2026-05-01T08:00:00Z'))

    const manager = mountComposable(() => useAttendanceLogsManager())
    await flushPromises()

    expect(apiFetch).toHaveBeenCalledWith('/employees', { query: { limit: 200 } })
    expect(apiFetch).toHaveBeenCalledWith('/export-jobs', { query: { page: 1, limit: 10 } })

    manager.applyDatePreset('this_month')
    expect(manager.filters.date_from).toBe('2026-05-01')
    expect(manager.filters.date_to).toBe('2026-05-01')
    expect(manager.isDatePresetActive('this_month')).toBe(true)
  })
})

import { flushPromises } from '@vue/test-utils'
import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createListResponse, createSuccessResponse } from '~/testing/api-response-fixtures'
import { mountComposable } from '~/testing/component-test-utils'
import { useAttendanceLogExports } from './use-attendance-log-exports'
import type { AttendanceLogFilters } from './types'
import type { ApiFetch } from '../roles/types'

describe('useAttendanceLogExports', () => {
  const filters = reactive<AttendanceLogFilters>({
    date_from: '2026-05-01',
    date_to: '',
    type: 'check_in',
    source: '',
    employee_id: '',
    status: '',
    selfie_status: '',
    org_unit_id: '',
    branch_id: '',
    work_location_id: '',
    exception_type: '',
  })

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('loads export jobs and exposes derived counts and menu state', async () => {
    const apiFetch = vi.fn(async () => createListResponse([
      {
        id: 'export-1',
        status: 'pending',
        format: 'xlsx',
        requested_by_name: 'Ayu',
        created_at: '2026-05-01T08:00:00Z',
        download_url: null,
      },
    ])) as ApiFetch

    const exportsManager = mountComposable(() => useAttendanceLogExports({
      apiFetch,
      filters,
      show: vi.fn(),
      t: (key) => key,
    }))

    await exportsManager.load()
    await flushPromises()

    expect(exportsManager.pendingCount.value).toBe(1)
    expect(exportsManager.completedCount.value).toBe(0)
    expect(exportsManager.menuItems.value).toEqual([
      { key: 'export', label: 'ui.export', disabled: false },
    ])
    expect(apiFetch).toHaveBeenCalledWith('/export-jobs', {
      query: { page: 1, limit: 10 },
    })
  })

  it('queues exports from the menu contract and refreshes the export list', async () => {
    const show = vi.fn()
    const apiFetch = vi.fn(async (path: string, options?: { method?: string, body?: Record<string, unknown> }) => {
      if (path === '/export-jobs' && options?.method === 'POST') {
        return createSuccessResponse({ id: 'export-2' })
      }

      return createListResponse([
        {
          id: 'export-2',
          status: 'completed',
          format: 'xlsx',
          requested_by_name: 'Ayu',
          created_at: '2026-05-01T08:00:00Z',
          download_url: 'https://example.test/export.xlsx',
        },
      ])
    }) as ApiFetch

    const exportsManager = mountComposable(() => useAttendanceLogExports({
      apiFetch,
      filters,
      show,
      t: (key) => key,
    }))

    exportsManager.menuOpen.value = true
    await exportsManager.selectMenuItem('export')
    await flushPromises()

    expect(exportsManager.menuOpen.value).toBe(false)
    expect(apiFetch).toHaveBeenCalledWith('/export-jobs', {
      method: 'POST',
      body: {
        resource_type: 'attendance_logs',
        format: 'xlsx',
        date_from: '2026-05-01',
        type: 'check_in',
      },
    })
    expect(show).toHaveBeenCalledWith('ui.attendanceExportQueued', 'success')
    expect(exportsManager.menuItems.value).toEqual([
      { key: 'export', label: 'ui.export', disabled: false },
    ])
    expect(exportsManager.items.value).toHaveLength(1)
  })

  it('resets list loading when fetching exports throws', async () => {
    const apiFetch = vi.fn(async () => {
      throw new Error('load failed')
    }) as ApiFetch

    const exportsManager = mountComposable(() => useAttendanceLogExports({
      apiFetch,
      filters,
      show: vi.fn(),
      t: (key) => key,
    }))

    await expect(exportsManager.load()).rejects.toThrow('load failed')
    expect(exportsManager.listLoading.value).toBe(false)
  })

  it('resets create loading when queueing exports throws', async () => {
    const show = vi.fn()
    const apiFetch = vi.fn(async (path: string, options?: { method?: string }) => {
      if (path === '/export-jobs' && options?.method === 'POST') {
        throw new Error('queue failed')
      }

      return createListResponse([])
    }) as ApiFetch

    const exportsManager = mountComposable(() => useAttendanceLogExports({
      apiFetch,
      filters,
      show,
      t: (key) => key,
    }))

    exportsManager.menuOpen.value = true

    await expect(exportsManager.selectMenuItem('export')).rejects.toThrow('queue failed')
    expect(exportsManager.menuOpen.value).toBe(false)
    expect(exportsManager.loading.value).toBe(false)
    expect(show).not.toHaveBeenCalled()
  })
})

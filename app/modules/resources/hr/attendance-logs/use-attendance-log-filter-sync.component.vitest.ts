import { flushPromises } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'
import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import { mountComposable } from '~/testing/component-test-utils'
import { createEmptyAttendanceLogFilters } from './attendance-log-format'
import { useAttendanceLogFilterSync } from './use-attendance-log-filter-sync'

describe('useAttendanceLogFilterSync', () => {
  it('hydrates filters from route query and syncs filter changes back without dropping unrelated params', async () => {
    const route = reactive<{ query: LocationQuery }>({
      query: {
        attendance_date: '2026-05-01',
        status: 'recorded',
        page: '3',
      },
    })
    const replaceRouteQuery = vi.fn(async (query: LocationQueryRaw) => {
      route.query = query as LocationQuery
    })
    const filters = reactive(createEmptyAttendanceLogFilters())

    const sync = mountComposable(() => useAttendanceLogFilterSync({
      filters,
      routeQuery: () => route.query,
      replaceRouteQuery,
    }))

    await flushPromises()

    expect(filters.date_from).toBe('2026-05-01')
    expect(filters.date_to).toBe('2026-05-01')
    expect(filters.status).toBe('recorded')
    expect(sync.listQuery.value).toEqual({
      date_from: '2026-05-01',
      date_to: '2026-05-01',
      status: 'recorded',
    })

    filters.type = 'check_in'
    await nextTick()
    await flushPromises()

    expect(replaceRouteQuery).toHaveBeenLastCalledWith({
      attendance_date: '2026-05-01',
      page: '3',
      date_from: '2026-05-01',
      date_to: '2026-05-01',
      status: 'recorded',
      type: 'check_in',
    })

    filters.type = ''
    await nextTick()
    await flushPromises()

    expect(replaceRouteQuery).toHaveBeenLastCalledWith({
      attendance_date: '2026-05-01',
      page: '3',
      date_from: '2026-05-01',
      date_to: '2026-05-01',
      status: 'recorded',
    })
  })
})

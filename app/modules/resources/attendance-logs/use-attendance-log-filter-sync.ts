import { computed, watch, type Reactive } from 'vue'
import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import {
  areQueriesEqual,
  attendanceLogFilterKeys,
  buildAttendanceLogFilterQuery,
  filtersFromQuery,
  pickAttendanceLogFilterQuery,
} from './attendance-log-format'
import type { AttendanceLogFilters } from './types'

type UseAttendanceLogFilterSyncOptions = {
  filters: Reactive<AttendanceLogFilters>
  routeQuery: () => LocationQuery
  replaceRouteQuery: (query: LocationQueryRaw) => Promise<void>
}

export const useAttendanceLogFilterSync = ({
  filters,
  routeQuery,
  replaceRouteQuery,
}: UseAttendanceLogFilterSyncOptions) => {
  const syncFiltersFromRoute = () => {
    Object.assign(filters, filtersFromQuery(routeQuery()))
  }

  const listQuery = computed(() => buildAttendanceLogFilterQuery(filters))

  watch(
    routeQuery,
    () => {
      syncFiltersFromRoute()
    },
    { deep: true, immediate: true },
  )

  watch(
    filters,
    async () => {
      const nextFilterQuery = listQuery.value
      const currentQuery = routeQuery()
      const currentFilterQuery = pickAttendanceLogFilterQuery(currentQuery)

      if (areQueriesEqual(currentFilterQuery, nextFilterQuery)) {
        return
      }

      const nextQuery = { ...currentQuery }
      for (const key of attendanceLogFilterKeys) {
        delete nextQuery[key]
      }

      await replaceRouteQuery({ ...nextQuery, ...nextFilterQuery })
    },
    { deep: true },
  )

  return {
    listQuery,
    syncFiltersFromRoute,
  }
}

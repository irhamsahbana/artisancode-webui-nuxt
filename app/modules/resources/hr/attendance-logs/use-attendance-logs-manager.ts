import { computed, onMounted, reactive } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'
import {
  createEmptyAttendanceLogFilters,
  getDatePresetRange,
  getSelfieUrl,
  hasSelfie,
  isDatePresetActive as resolveDatePresetActive,
  toLocalDateInputValue,
} from './attendance-log-format'
import { useAttendanceLogColumns } from './use-attendance-log-columns'
import { useAttendanceLogExports } from './use-attendance-log-exports'
import { useAttendanceLogFilterOptions } from './use-attendance-log-filter-options'
import { useAttendanceLogFilterSync } from './use-attendance-log-filter-sync'
import { useAttendanceLogOverlays } from './use-attendance-log-overlays'
import type { AttendanceLogFilters, AttendanceLogRow, DatePreset } from './types'

export const useAttendanceLogsManager = () => {
  const route = useRoute()
  const router = useRouter()
  const { apiFetch } = useApi()
  const { show } = useBanner()
  const { t } = useLocale()
  const { formatDateTime } = useDateTime()

  const filterOptions = useAttendanceLogFilterOptions({
    apiFetch,
    t,
  })
  const filters = reactive<AttendanceLogFilters>(createEmptyAttendanceLogFilters())
  const exportsManager = useAttendanceLogExports({
    apiFetch,
    filters,
    show,
    t,
  })
  const overlays = useAttendanceLogOverlays({
    exportMenuOpen: exportsManager.menuOpen,
  })
  const filterPanelOptions = computed(() => ({
    typeOptions: filterOptions.typeOptions.value,
    sourceOptions: filterOptions.sourceOptions.value,
    statusOptions: filterOptions.statusOptions.value,
    selfieOptions: filterOptions.selfieOptions.value,
    exceptionOptions: filterOptions.exceptionOptions.value,
    employeeOptions: filterOptions.employeeOptions.value,
    orgUnitOptions: filterOptions.orgUnitOptions.value,
    branchOptions: filterOptions.branchOptions.value,
    workLocationOptions: filterOptions.workLocationOptions.value,
  }))
  const columns = useAttendanceLogColumns({
    t,
    formatDateTime,
  })
  const { listQuery } = useAttendanceLogFilterSync({
    filters,
    routeQuery: () => route.query,
    replaceRouteQuery: async (query) => {
      await router.replace({ query })
    },
  })

  const today = () => toLocalDateInputValue(new Date())

  const applyDatePreset = (preset: DatePreset) => {
    Object.assign(filters, getDatePresetRange(preset, today()))
  }

  const clearFilters = () => {
    Object.assign(filters, createEmptyAttendanceLogFilters())
  }

  const updateFilter = (key: keyof AttendanceLogFilters, value: string) => {
    filters[key] = value
  }

  const isDatePresetActive = (preset: DatePreset) => (
    resolveDatePresetActive(filters, preset, today())
  )

  onMounted(() => {
    filterOptions.load()
    exportsManager.load()
  })

  const openSelfie = (row: AttendanceLogRow | null | undefined) => {
    const url = getSelfieUrl(row)
    if (!url || !import.meta.client) {
      return
    }

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const formatTimestamp = (value: string | null | undefined) => (
    formatDateTime(value, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  )

  return {
    columns,
    filterPanelOptions,
    filters,
    listQuery,
    filterPanelOpen: overlays.filterPanelOpen,
    exportListLoading: exportsManager.listLoading,
    exportItems: exportsManager.items,
    exportMenuOpen: exportsManager.menuOpen,
    completedExportCount: exportsManager.completedCount,
    pendingExportCount: exportsManager.pendingCount,
    exportMenuItems: exportsManager.menuItems,
    hasSelfie,
    toggleFilterPanel: overlays.toggleFilterPanel,
    closeFilterPanel: overlays.closeFilterPanel,
    toggleExportMenu: overlays.toggleExportMenu,
    closeExportMenu: overlays.closeExportMenu,
    isDatePresetActive,
    clearFilters,
    applyDatePreset,
    updateFilter,
    openSelfie,
    formatTimestamp,
    loadExports: exportsManager.load,
    downloadExport: exportsManager.download,
    handleExportMenuSelect: exportsManager.selectMenuItem,
  }
}

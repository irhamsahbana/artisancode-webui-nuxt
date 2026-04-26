<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

import type { ApiResponse, ListResponse } from '~/types/api'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'
import AttendanceLogFilterPanel from './attendance-log-filter-panel.vue'
import type { AttendanceLogFilters, DatePreset, ExportJob, ExportJobStatus, SelectOption } from './types'

defineOptions({ name: 'AttendanceLogsPage' })

type AttendanceLogRow = Record<string, unknown>
type EmployeeFilterItem = { id: string, employee_no: string, full_name: string }
type OrgUnitFilterItem = { id: string, name: string, category: string }
type BranchFilterItem = { id: string, name: string }
type WorkLocationFilterItem = { id: string, name: string }

const route = useRoute()
const router = useRouter()
const { apiFetch } = useApi()
const { show } = useBanner()
const { locale, t } = useLocale()
const { formatDateOnly: formatDateOnlyLabel, formatDateTime } = useDateTime()

const supportedKeys = [
  'date_from',
  'date_to',
  'type',
  'source',
  'employee_id',
  'status',
  'selfie_status',
  'org_unit_id',
  'branch_id',
  'work_location_id',
  'exception_type',
]

const columns = computed(() => [
  { key: 'employee_no', label: t('ui.employeeNo') },
  { key: 'employee_name', label: t('ui.employeeName') },
  {
    key: 'type',
    label: t('ui.type'),
    format: (value: unknown) => String(value ?? '').replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase()),
  },
  {
    key: 'source',
    label: t('ui.source'),
    format: (value: unknown) => String(value ?? '').replace(/\b\w/g, char => char.toUpperCase()),
  },
  {
    key: 'status',
    label: t('ui.status'),
    format: (value: unknown) => String(value ?? '').replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase()),
  },
  { key: 'attendance_date', label: t('ui.date') },
  {
    key: 'logged_at',
    label: t('ui.loggedAt'),
    format: (value: unknown) => {
      if (typeof value !== 'string' || value.length === 0) {
        return '-'
      }

      return formatDateTime(value, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }, value)
    },
  },
  {
    key: 'selfie_url',
    label: t('ui.photoProof'),
    format: (value: unknown) => (typeof value === 'string' && value.length > 0 ? t('ui.available') : '-'),
  },
])

const withAnyOption = (labelKey: string, options: SelectOption[]) => [{ value: '', label: t(labelKey) }, ...options]

const typeOptions = computed<SelectOption[]>(() => withAnyOption('ui.allTypes', [
  { value: 'check_in', label: t('ui.checkIn') },
  { value: 'check_out', label: t('ui.checkOut') },
]))

const sourceOptions = computed<SelectOption[]>(() => withAnyOption('ui.allSources', [
  { value: 'mobile', label: t('ui.mobile') },
  { value: 'web', label: t('ui.web') },
]))

const statusOptions = computed<SelectOption[]>(() => withAnyOption('ui.allStatuses', [
  { value: 'recorded', label: t('ui.recorded') },
]))

const selfieOptions = computed<SelectOption[]>(() => withAnyOption('ui.allPhotoStates', [
  { value: 'with_photo', label: t('ui.withPhoto') },
  { value: 'without_photo', label: t('ui.withoutPhoto') },
]))

const exceptionOptions = computed<SelectOption[]>(() => withAnyOption('ui.allExceptions', [
  { value: 'late_check_in', label: t('ui.lateCheckIn') },
  { value: 'missing_check_out', label: t('ui.missingCheckOut2') },
  { value: 'missing_check_in', label: t('ui.missingCheckIn2') },
]))

const employeeItems = ref<EmployeeFilterItem[]>([])
const orgUnitItems = ref<OrgUnitFilterItem[]>([])
const branchItems = ref<BranchFilterItem[]>([])
const workLocationItems = ref<WorkLocationFilterItem[]>([])
const employeeOptions = computed<SelectOption[]>(() => withAnyOption(
  'ui.allEmployees',
  employeeItems.value.map(item => ({
    value: item.id,
    label: `${item.full_name} (${item.employee_no})`,
  })),
))
const orgUnitCategoryLabelKeys: Record<string, string> = {
  branch: 'ui.branch',
  company: 'layout.companies',
  department: 'ui.department',
  division: 'ui.division',
  team: 'ui.team',
}

const orgUnitOptions = computed<SelectOption[]>(() => withAnyOption(
  'ui.allOrgUnits',
  orgUnitItems.value.map(item => ({
    value: item.id,
    label: item.category ? `${item.name} (${t(orgUnitCategoryLabelKeys[item.category] ?? 'ui.organizationUnit')})` : item.name,
  })),
))
const branchOptions = computed<SelectOption[]>(() => withAnyOption(
  'ui.allBranches',
  branchItems.value.map(item => ({
    value: item.id,
    label: item.name,
  })),
))
const workLocationOptions = computed<SelectOption[]>(() => withAnyOption(
  'ui.allWorkLocations',
  workLocationItems.value.map(item => ({
    value: item.id,
    label: item.name,
  })),
))
const exportLoading = ref(false)
const exportListLoading = ref(false)
const exportItems = ref<ExportJob[]>([])
let exportPollingTimer: ReturnType<typeof globalThis.setInterval> | null = null

const filters = reactive<AttendanceLogFilters>({
  date_from: '',
  date_to: '',
  type: '',
  source: '',
  employee_id: '',
  status: '',
  selfie_status: '',
  org_unit_id: '',
  branch_id: '',
  work_location_id: '',
  exception_type: '',
})

const getQueryValue = (key: string) => {
  const value = route.query[key]
  return typeof value === 'string' ? value : ''
}

const syncFiltersFromRoute = () => {
  const attendanceDate = getQueryValue('attendance_date')
  filters.date_from = getQueryValue('date_from') || attendanceDate
  filters.date_to = getQueryValue('date_to') || attendanceDate
  filters.type = getQueryValue('type')
  filters.source = getQueryValue('source')
  filters.employee_id = getQueryValue('employee_id')
  filters.status = getQueryValue('status')
  filters.selfie_status = getQueryValue('selfie_status')
  filters.org_unit_id = getQueryValue('org_unit_id')
  filters.branch_id = getQueryValue('branch_id')
  filters.work_location_id = getQueryValue('work_location_id')
  filters.exception_type = getQueryValue('exception_type')
}

const buildFilterQuery = () => {
  const result: Record<string, string> = {}

  if (filters.date_from) {
    result.date_from = filters.date_from
  }

  if (filters.date_to) {
    result.date_to = filters.date_to
  }

  for (const key of ['type', 'source', 'employee_id', 'status', 'selfie_status', 'org_unit_id', 'branch_id', 'work_location_id', 'exception_type']) {
    const value = filters[key as keyof typeof filters]
    if (typeof value === 'string' && value.length > 0) {
      result[key] = value
    }
  }

  return result
}

const areQueriesEqual = (left: Record<string, string>, right: Record<string, string>) => {
  const leftKeys = Object.keys(left).sort()
  const rightKeys = Object.keys(right).sort()
  if (leftKeys.length !== rightKeys.length) {
    return false
  }

  return leftKeys.every(key => left[key] === right[key])
}

watch(
  () => route.query,
  () => {
    syncFiltersFromRoute()
  },
  { deep: true, immediate: true },
)

watch(
  filters,
  async () => {
    const nextFilterQuery = buildFilterQuery()
    const currentFilterQuery = Object.fromEntries(
      supportedKeys.flatMap((key) => {
        const value = route.query[key]
        return typeof value === 'string' && value.length > 0 ? [[key, value]] : []
      }),
    )

    if (areQueriesEqual(currentFilterQuery, nextFilterQuery)) {
      return
    }

    const nextQuery = { ...route.query }
    for (const key of supportedKeys) {
      delete nextQuery[key]
    }
    await router.replace({ query: { ...nextQuery, ...nextFilterQuery } })
  },
  { deep: true },
)

const today = () => {
  const date = new Date()
  const timezoneOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

const shiftDate = (value: string, days: number) => {
  const date = new Date(`${value}T00:00:00`)
  date.setDate(date.getDate() + days)
  const timezoneOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

const getWeekStart = () => {
  const date = new Date(`${today()}T00:00:00`)
  const currentDay = date.getDay()
  const diff = currentDay === 0 ? -6 : 1 - currentDay
  date.setDate(date.getDate() + diff)
  const timezoneOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

const getMonthStart = () => {
  const date = new Date(`${today()}T00:00:00`)
  date.setDate(1)
  const timezoneOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

const applyDatePreset = (preset: DatePreset) => {
  const currentDay = today()

  if (preset === 'today') {
    filters.date_from = currentDay
    filters.date_to = currentDay
    return
  }

  if (preset === 'yesterday') {
    const yesterday = shiftDate(currentDay, -1)
    filters.date_from = yesterday
    filters.date_to = yesterday
    return
  }

  if (preset === 'this_week') {
    filters.date_from = getWeekStart()
    filters.date_to = currentDay
    return
  }

  filters.date_from = getMonthStart()
  filters.date_to = currentDay
}

const clearFilters = () => {
  filters.date_from = ''
  filters.date_to = ''
  filters.type = ''
  filters.source = ''
  filters.employee_id = ''
  filters.status = ''
  filters.selfie_status = ''
  filters.org_unit_id = ''
  filters.branch_id = ''
  filters.work_location_id = ''
  filters.exception_type = ''
}

const updateFilter = (key: keyof AttendanceLogFilters, value: string) => {
  filters[key] = value
}

const listQuery = computed(() => buildFilterQuery())
const filterPanelOpen = ref(false)
const exportMenuOpen = ref(false)

const toggleFilterPanel = () => {
  filterPanelOpen.value = !filterPanelOpen.value
  if (filterPanelOpen.value) {
    exportMenuOpen.value = false
  }
}

const toggleExportMenu = () => {
  exportMenuOpen.value = !exportMenuOpen.value
  if (exportMenuOpen.value) {
    filterPanelOpen.value = false
  }
}

const isDatePresetActive = (preset: DatePreset) => {
  const currentDay = today()

  if (preset === 'today') {
    return filters.date_from === currentDay && filters.date_to === currentDay
  }

  if (preset === 'yesterday') {
    const yesterday = shiftDate(currentDay, -1)
    return filters.date_from === yesterday && filters.date_to === yesterday
  }

  if (preset === 'this_week') {
    return filters.date_from === getWeekStart() && filters.date_to === currentDay
  }

  return filters.date_from === getMonthStart() && filters.date_to === currentDay
}

const completedExportCount = computed(() => exportItems.value.filter(item => item.status === 'completed').length)
const pendingExportCount = computed(() => exportItems.value.filter(item => item.status === 'pending' || item.status === 'processing').length)
const exportMenuItems = computed(() => [
  {
    key: 'export',
    label: exportLoading.value ? t('ui.queueing') : t('ui.export'),
    disabled: exportLoading.value,
  },
])

const handleExportMenuSelect = (key: string) => {
  if (key === 'export') {
    createExport()
  }
}

const mapItems = <T extends Record<string, unknown>>(
  response: ApiResponse<ListResponse<T>> | ApiResponse<{ items: T[] }>,
) => {
  const items = response.data && 'items' in response.data ? response.data.items : []
  return items
}

const loadFilterOptions = async () => {
  const [employeeResponse, orgUnitResponse, branchResponse, workLocationResponse] = await Promise.all([
    apiFetch<ListResponse<EmployeeFilterItem>>('/employees', {
      query: { limit: 200 },
    }),
    apiFetch<ListResponse<OrgUnitFilterItem>>('/org-units', {
      query: { limit: 300 },
    }),
    apiFetch<ListResponse<BranchFilterItem>>('/org-units', {
      query: { category: 'branch', limit: 200 },
    }),
    apiFetch<ListResponse<WorkLocationFilterItem>>('/work-locations', {
      query: { limit: 200 },
    }),
  ])

  employeeItems.value = mapItems(employeeResponse)
  orgUnitItems.value = mapItems(orgUnitResponse)
  branchItems.value = mapItems(branchResponse)
  workLocationItems.value = mapItems(workLocationResponse)
}

onMounted(() => {
  loadFilterOptions()
  loadExports()
})

onBeforeUnmount(() => {
  stopExportPolling()
})

const getSelfieUrl = (row: AttendanceLogRow | null | undefined) => {
  if (!row) {
    return ''
  }

  const value = row.selfie_url
  return typeof value === 'string' ? value : ''
}

const hasSelfie = (row: AttendanceLogRow | null | undefined) => getSelfieUrl(row).length > 0

const openSelfie = (row: AttendanceLogRow | null | undefined) => {
  const url = getSelfieUrl(row)
  if (!url || !import.meta.client) {
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}

const formatTimestamp = (value: string | null | undefined) => {
  return formatDateTime(value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const formatAttendanceDate = (value: unknown) => {
  if (typeof value !== 'string' || value.length === 0) {
    return '-'
  }

  return formatDateOnlyLabel(value, {
    dateStyle: 'full',
  }, value)
}

const formatTitleValue = (value: unknown) => {
  if (typeof value !== 'string' || value.length === 0) {
    return '-'
  }

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

const formatCoordinate = (value: unknown) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-'
  }

  return value.toFixed(6)
}

const formatDetailValue = (key: string, value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (key === 'type' || key === 'source' || key === 'status') {
    return formatTitleValue(value)
  }

  if (key === 'attendance_date') {
    return formatAttendanceDate(value)
  }

  if (key === 'logged_at' || key === 'created_at' || key === 'updated_at') {
    return typeof value === 'string' ? formatTimestamp(value) : '-'
  }

  if (key === 'latitude' || key === 'longitude') {
    return formatCoordinate(value)
  }

  if (key === 'selfie_url') {
    return typeof value === 'string' && value.length > 0 ? t('ui.available') : '-'
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    }
    catch {
      return String(value)
    }
  }

  return String(value)
}

const detailFieldLabels: Record<string, string> = {
  employee_name: 'ui.employeeName',
  employee_no: 'ui.employeeNo',
  employee_id: 'ui.employeeId',
  attendance_date: 'ui.attendanceDate',
  logged_at: 'ui.loggedAt',
  type: 'ui.attendanceType',
  source: 'ui.source',
  status: 'ui.status',
  notes: 'ui.notes',
  address: 'ui.recordedAddress',
  latitude: 'common.latitude',
  longitude: 'common.longitude',
  device_name: 'ui.deviceName',
  device_id: 'ui.deviceId',
  selfie_url: 'ui.photoProof',
  selfie_file_id: 'ui.photoFileId',
  created_at: 'ui.createdAt',
  updated_at: 'ui.updatedAt',
  id: 'ui.attendanceLogId',
}

const getDetailFieldLabel = (key: string) => detailFieldLabels[key] ? t(detailFieldLabels[key]) : toTitleCase(key)

const getDetailValue = (row: AttendanceLogRow | null | undefined, key: string) => row?.[key]

const buildDetailSummary = (row: AttendanceLogRow | null | undefined) => {
  if (!row) {
    return []
  }

  return [
    {
      key: 'attendance_date',
      label: t('ui.attendanceDate'),
      value: typeof getDetailValue(row, 'attendance_date') === 'string'
        ? formatAttendanceDate(getDetailValue(row, 'attendance_date'))
        : '-',
    },
    {
      key: 'logged_at',
      label: t('ui.loggedAt'),
      value: formatDetailValue('logged_at', getDetailValue(row, 'logged_at')),
    },
    {
      key: 'type',
      label: t('ui.type'),
      value: formatDetailValue('type', getDetailValue(row, 'type')),
    },
    {
      key: 'source',
      label: t('ui.source'),
      value: formatDetailValue('source', getDetailValue(row, 'source')),
    },
  ].filter(item => item.value !== '-')
}

const detailSections = computed(() => {
  return [
    {
      id: 'employee',
      title: t('ui.employeeInformation'),
      description: t('ui.whoTheAttendanceRecordBelongsTo'),
      fields: [
        'employee_name',
        'employee_no',
        'employee_id',
      ],
    },
    {
      id: 'attendance',
      title: t('ui.attendanceRecord'),
      description: t('ui.mainAttendanceActivityAndSupportingNotes'),
      fields: [
        'attendance_date',
        'logged_at',
        'type',
        'source',
        'status',
        'notes',
      ],
    },
    {
      id: 'location',
      title: t('ui.locationDetails'),
      description: t('ui.addressAndCoordinatesCapturedWhenTheLogWasCreated'),
      fields: [
        'address',
        'latitude',
        'longitude',
      ],
    },
    {
      id: 'device',
      title: t('ui.deviceDetails'),
      description: t('ui.deviceInformationUsedDuringTheAttendanceSubmission'),
      fields: [
        'device_name',
        'device_id',
      ],
    },
    {
      id: 'system',
      title: t('ui.systemMetadata'),
      description: t('ui.internalIdentifiersAndTimestampsForAuditing'),
      fields: [
        'id',
        'selfie_file_id',
        'created_at',
        'updated_at',
      ],
    },
  ]
})

const getSectionEntries = (row: AttendanceLogRow | null | undefined, fields: string[]) => {
  if (!row) {
    return []
  }

  return fields
    .map((key) => {
      const value = getDetailValue(row, key)
      const formattedValue = formatDetailValue(key, value)

      if (formattedValue === '-') {
        return null
      }

      return {
        key,
        label: getDetailFieldLabel(key),
        value: formattedValue,
        multiline: key === 'notes' || key === 'address' || (typeof value === 'object' && value !== null),
      }
    })
    .filter((item): item is { key: string, label: string, value: string, multiline: boolean } => item !== null)
}

const getMapsUrl = (row: AttendanceLogRow | null | undefined) => {
  if (!row) {
    return ''
  }

  const latitude = getDetailValue(row, 'latitude')
  const longitude = getDetailValue(row, 'longitude')

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return ''
  }

  return `https://www.google.com/maps?q=${latitude},${longitude}`
}

const hasLocationCoordinates = (row: AttendanceLogRow | null | undefined) => getMapsUrl(row).length > 0

const getMapEmbedUrl = (row: AttendanceLogRow | null | undefined) => {
  if (!row) {
    return ''
  }

  const latitude = getDetailValue(row, 'latitude')
  const longitude = getDetailValue(row, 'longitude')

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return ''
  }

  const latitudeOffset = 0.005
  const longitudeOffset = 0.005
  const bbox = [
    longitude - longitudeOffset,
    latitude - latitudeOffset,
    longitude + longitudeOffset,
    latitude + latitudeOffset,
  ].join('%2C')

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`
}

const getExportStatusVariant = (status: ExportJobStatus) => {
  if (status === 'completed') {
    return 'default'
  }

  if (status === 'failed' || status === 'expired') {
    return 'destructive'
  }

  return 'secondary'
}

const toTitleCase = (value: string) => value.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase())

const loadExports = async () => {
  exportListLoading.value = true
  const response = await apiFetch<ListResponse<ExportJob>>('/export-jobs', {
    query: { page: 1, limit: 10 },
  })

  exportItems.value = response.data?.items ?? []
  exportListLoading.value = false

  if (exportItems.value.some(item => item.status === 'pending' || item.status === 'processing')) {
    startExportPolling()
    return
  }

  stopExportPolling()
}

const startExportPolling = () => {
  if (exportPollingTimer || !import.meta.client) {
    return
  }

  exportPollingTimer = globalThis.setInterval(() => {
    loadExports()
  }, 5000)
}

const stopExportPolling = () => {
  if (!exportPollingTimer || !import.meta.client) {
    return
  }

  globalThis.clearInterval(exportPollingTimer)
  exportPollingTimer = null
}

const createExport = async () => {
  exportMenuOpen.value = false
  exportLoading.value = true
  const response = await apiFetch<{ id: string }>('/export-jobs', {
    method: 'POST',
    body: {
      resource_type: 'attendance_logs',
      format: 'xlsx',
      ...buildFilterQuery(),
    },
  })
  exportLoading.value = false

  if (!response.success) {
    return
  }

  show(
    t('ui.attendanceExportQueued'),
    'success',
  )
  await loadExports()
}

const downloadExport = (item: ExportJob) => {
  if (!item.download_url || !import.meta.client) {
    return
  }

  window.open(item.download_url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <div class="space-y-6">
    <ResourceList
      title="Attendance Logs"
      endpoint="/attendance-logs"
      :extra-query="listQuery"
      :columns="columns"
      :search-placeholder="t('ui.searchAttendanceLogs')"
      :show-search-filter-trigger="true"
      :search-filter-open="filterPanelOpen"
      loading-variant="skeleton"
      :can-delete="false"
      @search-filter-trigger="toggleFilterPanel"
    >
      <template #header-actions>
        <div class="flex w-full items-center justify-end gap-2">
          <ActionMenu
            :open="exportMenuOpen"
            :label="t('ui.export')"
            :items="exportMenuItems"
            @toggle="toggleExportMenu"
            @close="exportMenuOpen = false"
            @select="handleExportMenuSelect"
          />
        </div>
      </template>

      <template #filters>
        <AttendanceLogFilterPanel
          :filters="filters"
          :open="filterPanelOpen"
          :employee-options="employeeOptions"
          :status-options="statusOptions"
          :type-options="typeOptions"
          :source-options="sourceOptions"
          :selfie-options="selfieOptions"
          :org-unit-options="orgUnitOptions"
          :branch-options="branchOptions"
          :work-location-options="workLocationOptions"
          :exception-options="exceptionOptions"
          :is-date-preset-active="isDatePresetActive"
          @close="filterPanelOpen = false"
          @clear="clearFilters"
          @apply-date-preset="applyDatePreset"
          @update-filter="updateFilter"
        />
      </template>

      <template #row-actions="{ row, close }">
        <button
          v-if="hasSelfie(row)"
          class="w-full rounded px-3 py-2 text-left hover:bg-accent"
          @click="openSelfie(row); close()"
        >
          {{ t('ui.viewPhoto') }}
        </button>
      </template>

      <template #detail="{ row, loading, close }">
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 sm:px-6 sm:py-8"
          @click.self="close"
        >
          <div class="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl border bg-card shadow-xl">
            <div class="flex items-center justify-between gap-4 border-b px-5 py-4 sm:px-6">
              <div class="min-w-0">
                <div class="text-lg font-semibold sm:text-xl">
                  {{ t('ui.attendanceLogDetail') }}
                </div>
                <div class="text-sm text-muted-foreground">
                  {{ t('ui.reviewTheAttendanceRecordWithACleanerSummarySupportingContextAndPhotoProof') }}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                @click="close"
              >
                {{ t('ui.close') }}
              </Button>
            </div>

            <div class="grid max-h-[calc(90vh-73px)] gap-0 overflow-auto lg:grid-cols-[minmax(0,1fr)_360px]">
              <div class="space-y-5 px-5 py-5 sm:px-6">
                <div
                  v-if="loading"
                  class="rounded-xl border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground"
                >
                  {{ t('ui.loadingAttendanceDetail') }}
                </div>

                <template v-else>
                  <div class="rounded-2xl border bg-muted/20 p-4 sm:p-5">
                    <div class="flex flex-wrap items-start justify-between gap-4">
                      <div class="space-y-2">
                        <div class="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          {{ t('ui.attendanceSummary') }}
                        </div>
                        <div class="text-xl font-semibold leading-tight">
                          {{ String(row?.employee_name ?? t('ui.unknownEmployee')) }}
                        </div>
                        <div class="text-sm text-muted-foreground">
                          {{ String(row?.employee_no ?? '-') }}
                        </div>
                      </div>
                      <div class="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="secondary"
                          class="rounded-full px-3 py-1 text-xs"
                        >
                          {{ formatDetailValue('type', row?.type) }}
                        </Badge>
                        <Badge
                          variant="outline"
                          class="rounded-full px-3 py-1 text-xs"
                        >
                          {{ formatDetailValue('status', row?.status) }}
                        </Badge>
                        <Badge
                          variant="outline"
                          class="rounded-full px-3 py-1 text-xs"
                        >
                          {{ formatDetailValue('source', row?.source) }}
                        </Badge>
                      </div>
                    </div>

                    <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div
                        v-for="item in buildDetailSummary(row)"
                        :key="item.key"
                        class="rounded-xl border bg-background px-4 py-3"
                      >
                        <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {{ item.label }}
                        </div>
                        <div class="mt-1 text-sm font-medium leading-snug">
                          {{ item.value }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="space-y-4">
                    <div
                      v-for="section in detailSections"
                      :key="section.id"
                      class="rounded-2xl border bg-background p-4 sm:p-5"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div>
                          <div class="text-sm font-semibold">
                            {{ section.title }}
                          </div>
                          <div class="text-xs text-muted-foreground">
                            {{ section.description }}
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          class="rounded-full px-2.5 py-1 text-[11px]"
                        >
                          {{ getSectionEntries(row, section.fields).length }}
                        </Badge>
                      </div>

                      <div
                        v-if="getSectionEntries(row, section.fields).length === 0"
                        class="mt-4 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground"
                      >
                        {{ t('ui.noDataAvailableInThisSection') }}
                      </div>

                      <div
                        v-else
                        class="mt-4 grid gap-3"
                      >
                        <div
                          v-for="entry in getSectionEntries(row, section.fields)"
                          :key="entry.key"
                          class="grid gap-2 rounded-xl border bg-muted/20 px-4 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-start"
                        >
                          <div class="text-sm font-medium text-muted-foreground">
                            {{ entry.label }}
                          </div>
                          <div
                            class="break-words text-sm leading-6 text-foreground"
                            :class="entry.multiline ? 'whitespace-pre-wrap' : ''"
                          >
                            {{ entry.value }}
                          </div>
                        </div>
                      </div>

                      <div
                        v-if="section.id === 'location' && hasLocationCoordinates(row)"
                        class="mt-4 space-y-3"
                      >
                        <div class="overflow-hidden rounded-2xl border bg-background">
                          <iframe
                            :src="getMapEmbedUrl(row)"
                            class="h-64 w-full"
                            loading="lazy"
                            referrerpolicy="no-referrer-when-downgrade"
                            :title="t('ui.attendanceLocationMap')"
                          />
                        </div>

                        <div class="flex justify-end">
                          <a
                            :href="getMapsUrl(row)"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-accent"
                          >
                            {{ t('ui.openCoordinatesInMaps') }}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>

              <div class="border-t bg-muted/10 px-5 py-5 sm:px-6 lg:border-l lg:border-t-0">
                <div class="sticky top-0 space-y-4">
                  <div>
                    <div class="text-sm font-semibold">
                      {{ t('ui.photoProof') }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ t('ui.useThePhotoToQuicklyVerifyThatTheRecordMatchesTheEmployeeSubmission') }}
                    </div>
                  </div>

                  <div
                    v-if="loading"
                    class="rounded-xl border border-dashed p-6 text-sm text-muted-foreground"
                  >
                    {{ t('ui.loadingPhoto') }}
                  </div>
                  <div
                    v-else-if="hasSelfie(row)"
                    class="space-y-4"
                  >
                    <div class="overflow-hidden rounded-2xl border bg-white">
                      <img
                        :src="getSelfieUrl(row)"
                        alt="Attendance photo proof"
                        class="max-h-[52vh] w-full object-contain"
                      >
                    </div>

                    <div class="grid gap-3">
                      <div class="rounded-xl border bg-background px-4 py-3">
                        <div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {{ t('ui.photoStatus') }}
                        </div>
                        <div class="mt-1 text-sm font-medium">
                          {{ t('ui.available') }}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        class="w-full"
                        @click="openSelfie(row)"
                      >
                        {{ t('ui.openFullSize') }}
                      </Button>
                    </div>
                  </div>
                  <div
                    v-else
                    class="rounded-2xl border border-dashed bg-background p-6 text-sm text-muted-foreground"
                  >
                    {{ t('ui.noPhotoProofIsAttachedToThisAttendanceLog') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </ResourceList>

    <Card class="overflow-hidden border-slate-200/80 shadow-[0_20px_60px_-52px_rgba(15,23,42,0.8)] dark:border-slate-700/80 dark:bg-slate-950">
      <CardHeader class="flex flex-col gap-4 border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.98))] dark:border-slate-700/80 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <CardTitle>{{ t('ui.recentExports') }}</CardTitle>
            <Badge
              variant="secondary"
              class="rounded-full px-3 py-1 text-xs"
            >
              {{ exportItems.length }}
            </Badge>
          </div>
          <p class="text-sm leading-6 text-muted-foreground dark:text-slate-300">
            {{ t('ui.exportsFollowTheActiveFiltersAtTheTimeTheRequestIsCreatedAndWillAppearHereOnceTheFileIsReadyToDownload') }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            class="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
          >
            {{ completedExportCount }} {{ t('ui.readyFiles') }}
          </Badge>
          <Badge
            variant="outline"
            class="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
          >
            {{ pendingExportCount }} {{ t('ui.inQueue') }}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            class="rounded-full px-4"
            :disabled="exportListLoading"
            @click="loadExports"
          >
            {{ t('ui.refresh') }}
          </Button>
        </div>
      </CardHeader>
      <CardContent class="space-y-4 pt-5">
        <div
          v-if="exportListLoading && exportItems.length === 0"
          class="text-sm text-muted-foreground"
        >
          {{ t('ui.loadingRecentExports') }}
        </div>

        <div
          v-else-if="exportItems.length === 0"
          class="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5 text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
        >
          {{ t('ui.noExportRequestsYetStartOneFromTheExportButtonAbove') }}
        </div>

        <div
          v-else
          class="space-y-4"
        >
          <div
            v-for="item in exportItems"
            :key="item.id"
            class="rounded-3xl border p-4 transition hover:border-slate-300 hover:shadow-[0_18px_44px_-36px_rgba(15,23,42,0.7)] dark:hover:border-slate-600 dark:hover:shadow-[0_20px_48px_-36px_rgba(0,0,0,0.95)]"
            :class="item.status === 'completed'
              ? 'border-emerald-200/80 bg-[linear-gradient(180deg,rgba(236,253,245,0.85),rgba(255,255,255,0.98))] dark:border-emerald-900/70 dark:bg-[linear-gradient(180deg,rgba(6,78,59,0.34),rgba(2,6,23,0.94))]'
              : item.status === 'failed' || item.status === 'expired'
                ? 'border-rose-200/80 bg-[linear-gradient(180deg,rgba(255,241,242,0.85),rgba(255,255,255,0.98))] dark:border-rose-900/70 dark:bg-[linear-gradient(180deg,rgba(127,29,29,0.3),rgba(2,6,23,0.94))]'
                : 'border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.85),rgba(255,255,255,0.98))] dark:border-slate-700 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.84),rgba(2,6,23,0.94))]'"
          >
            <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div class="space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                  <Badge
                    :variant="getExportStatusVariant(item.status)"
                    class="rounded-full px-3 py-1"
                  >
                    {{ toTitleCase(item.status) }}
                  </Badge>
                  <Badge
                    variant="secondary"
                    class="rounded-full px-3 py-1"
                  >
                    {{ item.format.toUpperCase() }}
                  </Badge>
                  <span class="text-sm font-medium dark:text-slate-100">
                    {{ item.requested_by_name }}
                  </span>
                </div>

                <div class="grid gap-2 text-sm text-muted-foreground dark:text-slate-300 sm:grid-cols-2 xl:grid-cols-4">
                  <div class="rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/75">
                    <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:text-slate-300">
                      {{ t('ui.requested') }}
                    </div>
                    <div class="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {{ formatTimestamp(item.created_at) }}
                    </div>
                  </div>
                  <div class="rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/75">
                    <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:text-slate-300">
                      {{ t('ui.started') }}
                    </div>
                    <div class="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {{ formatTimestamp(item.started_at) }}
                    </div>
                  </div>
                  <div class="rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/75">
                    <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:text-slate-300">
                      {{ t('ui.completed') }}
                    </div>
                    <div class="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {{ formatTimestamp(item.completed_at) }}
                    </div>
                  </div>
                  <div class="rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/75">
                    <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:text-slate-300">
                      {{ t('ui.expires') }}
                    </div>
                    <div class="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {{ formatTimestamp(item.expires_at) }}
                    </div>
                  </div>
                </div>

                <p
                  v-if="item.error_message"
                  class="text-sm text-destructive"
                >
                  {{ item.error_message }}
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-2 lg:justify-end">
                <Button
                  v-if="item.download_url"
                  size="sm"
                  class="rounded-full px-4"
                  @click="downloadExport(item)"
                >
                  {{ t('ui.download') }}
                </Button>
                <span
                  v-else
                  class="rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300"
                >
                  {{ item.status === 'failed' ? t('ui.generationFailed') : t('ui.waitingForFile') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

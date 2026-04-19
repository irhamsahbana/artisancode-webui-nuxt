<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

import type { ApiResponse, ListResponse } from '~/types/api'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'
import { localizeUiText } from '~/utils/ui-localization'

defineOptions({ name: 'AttendanceLogsPage' })

type SelectOption = {
  value: string
  label: string
}

type AttendanceLogRow = Record<string, unknown>

const route = useRoute()
const router = useRouter()
const { apiFetch } = useApi()
const { show } = useBanner()
const { locale } = useLocale()
const { formatDateOnly: formatDateOnlyLabel, formatDateTime } = useDateTime()
const uiText = (value: string) => localizeUiText(locale.value, value)

type ExportJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired'
type ExportJobFormat = 'xlsx'

type ExportJob = {
  id: string
  resource_type: string
  resource_label: string
  format: ExportJobFormat
  status: ExportJobStatus
  requested_by_name: string
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  expires_at: string | null
  created_at: string
  download_url: string | null
}

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

const columns = [
  { key: 'employee_no', label: 'Employee No' },
  { key: 'employee_name', label: 'Employee Name' },
  {
    key: 'type',
    label: 'Type',
    format: (value: unknown) => String(value ?? '').replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase()),
  },
  {
    key: 'source',
    label: 'Source',
    format: (value: unknown) => String(value ?? '').replace(/\b\w/g, char => char.toUpperCase()),
  },
  {
    key: 'status',
    label: 'Status',
    format: (value: unknown) => String(value ?? '').replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase()),
  },
  { key: 'attendance_date', label: 'Date' },
  {
    key: 'logged_at',
    label: 'Logged At',
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
    label: 'Photo Proof',
    format: (value: unknown) => (typeof value === 'string' && value.length > 0 ? uiText('Available') : '-'),
  },
]

const withAnyOption = (label: string, options: SelectOption[]) => [{ value: '', label: uiText(label) }, ...options]

const typeOptions = computed<SelectOption[]>(() => withAnyOption('All types', [
  { value: 'check_in', label: uiText('Check In') },
  { value: 'check_out', label: uiText('Check Out') },
]))

const sourceOptions = computed<SelectOption[]>(() => withAnyOption('All sources', [
  { value: 'mobile', label: uiText('Mobile') },
  { value: 'web', label: uiText('Web') },
]))

const statusOptions = computed<SelectOption[]>(() => withAnyOption('All statuses', [
  { value: 'recorded', label: uiText('Recorded') },
]))

const selfieOptions = computed<SelectOption[]>(() => withAnyOption('All photo states', [
  { value: 'with_photo', label: uiText('With Photo') },
  { value: 'without_photo', label: uiText('Without Photo') },
]))

const exceptionOptions = computed<SelectOption[]>(() => withAnyOption('All exceptions', [
  { value: 'late_check_in', label: uiText('Late Check In') },
  { value: 'missing_check_out', label: uiText('Missing Check Out') },
  { value: 'missing_check_in', label: uiText('Missing Check In') },
]))

const employeeOptions = ref<SelectOption[]>(withAnyOption('All employees', []))
const orgUnitOptions = ref<SelectOption[]>(withAnyOption('All org units', []))
const branchOptions = ref<SelectOption[]>(withAnyOption('All branches', []))
const workLocationOptions = ref<SelectOption[]>(withAnyOption('All work locations', []))
const exportLoading = ref(false)
const exportListLoading = ref(false)
const exportItems = ref<ExportJob[]>([])
let exportPollingTimer: ReturnType<typeof globalThis.setInterval> | null = null

const filters = reactive({
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

const applyDatePreset = (preset: 'today' | 'yesterday' | 'this_week' | 'this_month') => {
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

const listQuery = computed(() => buildFilterQuery())
const advancedFilterKeys = ['type', 'source', 'selfie_status', 'org_unit_id', 'branch_id', 'work_location_id'] as const
const primaryFilterKeys = ['date_from', 'date_to', 'employee_id', 'exception_type', 'status'] as const
const advancedFiltersOpen = ref(false)

const getOptionLabel = (options: SelectOption[], value: string) =>
  options.find(option => option.value === value)?.label ?? value

const activeFilterChips = computed(() => {
  const chips: Array<{ key: keyof typeof filters, label: string, value: string }> = []

  if (filters.date_from || filters.date_to) {
    chips.push({
      key: filters.date_from ? 'date_from' : 'date_to',
      label: uiText('Date range'),
      value:
        filters.date_from && filters.date_to
          ? filters.date_from === filters.date_to
            ? filters.date_from
            : `${filters.date_from} to ${filters.date_to}`
          : (filters.date_from || filters.date_to),
    })
  }

  const optionLookups: Array<{ key: keyof typeof filters, label: string, options: SelectOption[] }> = [
    { key: 'employee_id', label: uiText('Employee'), options: employeeOptions.value },
    { key: 'exception_type', label: uiText('Exception'), options: exceptionOptions.value },
    { key: 'status', label: uiText('Status'), options: statusOptions.value },
    { key: 'type', label: uiText('Type'), options: typeOptions.value },
    { key: 'source', label: uiText('Source'), options: sourceOptions.value },
    { key: 'selfie_status', label: uiText('Photo proof'), options: selfieOptions.value },
    { key: 'org_unit_id', label: uiText('Org unit'), options: orgUnitOptions.value },
    { key: 'branch_id', label: uiText('Branch'), options: branchOptions.value },
    { key: 'work_location_id', label: uiText('Work location'), options: workLocationOptions.value },
  ]

  for (const item of optionLookups) {
    const value = filters[item.key]
    if (value) {
      chips.push({
        key: item.key,
        label: item.label,
        value: getOptionLabel(item.options, value),
      })
    }
  }

  return chips
})

const activeFilterCount = computed(() => activeFilterChips.value.length)
const advancedFilterCount = computed(() => advancedFilterKeys.filter(key => filters[key]).length)
const primaryFilterCount = computed(() => primaryFilterKeys.filter(key => filters[key]).length)

const formatFilterDateLabel = (value: string) => (
  formatDateOnlyLabel(value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }, value) ?? value
)

const dateRangeSummary = computed(() => {
  if (!filters.date_from && !filters.date_to) {
    return uiText('No date range selected')
  }

  if (filters.date_from && filters.date_to) {
    return filters.date_from === filters.date_to
      ? formatFilterDateLabel(filters.date_from)
      : `${formatFilterDateLabel(filters.date_from)} - ${formatFilterDateLabel(filters.date_to)}`
  }

  return formatFilterDateLabel(filters.date_from || filters.date_to)
})

const completedExportCount = computed(() => exportItems.value.filter(item => item.status === 'completed').length)
const pendingExportCount = computed(() => exportItems.value.filter(item => item.status === 'pending' || item.status === 'processing').length)
const latestExport = computed(() => exportItems.value[0] ?? null)

watch(
  advancedFilterCount,
  (count) => {
    if (count > 0) {
      advancedFiltersOpen.value = true
    }
  },
  { immediate: true },
)

const clearFilter = (key: keyof typeof filters) => {
  if (key === 'date_from' || key === 'date_to') {
    filters.date_from = ''
    filters.date_to = ''
    return
  }

  filters[key] = ''
}

const toggleAdvancedFilters = () => {
  advancedFiltersOpen.value = !advancedFiltersOpen.value
}

const mapOptions = <T extends Record<string, unknown>>(
  response: ApiResponse<ListResponse<T>> | ApiResponse<{ items: T[] }>,
  getOption: (item: T) => SelectOption | null,
) => {
  const items = response.data && 'items' in response.data ? response.data.items : []
  return items
    .map(getOption)
    .filter((item): item is SelectOption => item !== null)
}

const loadFilterOptions = async () => {
  const [employeeResponse, orgUnitResponse, branchResponse, workLocationResponse] = await Promise.all([
    apiFetch<ListResponse<{ id: string, employee_no: string, full_name: string }>>('/employees', {
      query: { limit: 200 },
    }),
    apiFetch<ListResponse<{ id: string, name: string, category: string }>>('/org-units', {
      query: { limit: 300 },
    }),
    apiFetch<ListResponse<{ id: string, name: string }>>('/org-units', {
      query: { category: 'branch', limit: 200 },
    }),
    apiFetch<ListResponse<{ id: string, name: string }>>('/work-locations', {
      query: { limit: 200 },
    }),
  ])

  employeeOptions.value = withAnyOption(
    'All employees',
    mapOptions(employeeResponse, item => ({
      value: item.id,
      label: `${item.full_name} (${item.employee_no})`,
    })),
  )

  orgUnitOptions.value = withAnyOption(
    'All org units',
    mapOptions(orgUnitResponse, item => ({
      value: item.id,
      label: item.category ? `${item.name} (${item.category})` : item.name,
    })),
  )

  branchOptions.value = withAnyOption(
    'All branches',
    mapOptions(branchResponse, item => ({
      value: item.id,
      label: item.name,
    })),
  )

  workLocationOptions.value = withAnyOption(
    'All work locations',
    mapOptions(workLocationResponse, item => ({
      value: item.id,
      label: item.name,
    })),
  )
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
    return typeof value === 'string' && value.length > 0 ? uiText('Available') : '-'
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
  employee_name: 'Employee Name',
  employee_no: 'Employee No',
  employee_id: 'Employee ID',
  attendance_date: 'Attendance Date',
  logged_at: 'Logged At',
  type: 'Attendance Type',
  source: 'Source',
  status: 'Status',
  notes: 'Notes',
  address: 'Recorded Address',
  latitude: 'Latitude',
  longitude: 'Longitude',
  device_name: 'Device Name',
  device_id: 'Device ID',
  selfie_url: 'Photo Proof',
  selfie_file_id: 'Photo File ID',
  created_at: 'Created At',
  updated_at: 'Updated At',
  id: 'Attendance Log ID',
}

const getDetailFieldLabel = (key: string) => uiText(detailFieldLabels[key] ?? toTitleCase(key))

const getDetailValue = (row: AttendanceLogRow | null | undefined, key: string) => row?.[key]

const buildDetailSummary = (row: AttendanceLogRow | null | undefined) => {
  if (!row) {
    return []
  }

  return [
    {
      key: 'attendance_date',
      label: uiText('Attendance Date'),
      value: typeof getDetailValue(row, 'attendance_date') === 'string'
        ? formatAttendanceDate(getDetailValue(row, 'attendance_date'))
        : '-',
    },
    {
      key: 'logged_at',
      label: uiText('Logged At'),
      value: formatDetailValue('logged_at', getDetailValue(row, 'logged_at')),
    },
    {
      key: 'type',
      label: uiText('Type'),
      value: formatDetailValue('type', getDetailValue(row, 'type')),
    },
    {
      key: 'source',
      label: uiText('Source'),
      value: formatDetailValue('source', getDetailValue(row, 'source')),
    },
  ].filter(item => item.value !== '-')
}

const detailSections = computed(() => {
  return [
    {
      id: 'employee',
      title: uiText('Employee Information'),
      description: uiText('Who the attendance record belongs to.'),
      fields: [
        'employee_name',
        'employee_no',
        'employee_id',
      ],
    },
    {
      id: 'attendance',
      title: uiText('Attendance Record'),
      description: uiText('Main attendance activity and supporting notes.'),
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
      title: uiText('Location Details'),
      description: uiText('Address and coordinates captured when the log was created.'),
      fields: [
        'address',
        'latitude',
        'longitude',
      ],
    },
    {
      id: 'device',
      title: uiText('Device Details'),
      description: uiText('Device information used during the attendance submission.'),
      fields: [
        'device_name',
        'device_id',
      ],
    },
    {
      id: 'system',
      title: uiText('System Metadata'),
      description: uiText('Internal identifiers and timestamps for auditing.'),
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
    uiText('Attendance export queued.'),
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
      :search-placeholder="uiText('Search attendance logs...')"
      loading-variant="skeleton"
      :can-delete="false"
    >
      <template #header-actions>
        <div class="flex w-full justify-end lg:w-[320px]">
          <FloatingPanel
            v-model:open="advancedFiltersOpen"
            :title="uiText('Advanced filters')"
            :description="uiText('Apply more specific conditions without changing the table layout.')"
            width-class="w-full max-w-lg"
          >
            <div class="space-y-4">
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-1">
                  <Label class="text-xs text-muted-foreground">{{ uiText('Type') }}</Label>
                  <SearchableSelect
                    v-model="filters.type"
                    :options="typeOptions"
                    :placeholder="uiText('All types')"
                    :search-placeholder="uiText('Search type...')"
                    class="w-full"
                  />
                </div>

                <div class="space-y-1">
                  <Label class="text-xs text-muted-foreground">{{ uiText('Source') }}</Label>
                  <SearchableSelect
                    v-model="filters.source"
                    :options="sourceOptions"
                    :placeholder="uiText('All sources')"
                    :search-placeholder="uiText('Search source...')"
                    class="w-full"
                  />
                </div>

                <div class="space-y-1">
                  <Label class="text-xs text-muted-foreground">{{ uiText('Photo proof') }}</Label>
                  <SearchableSelect
                    v-model="filters.selfie_status"
                    :options="selfieOptions"
                    :placeholder="uiText('All photo states')"
                    :search-placeholder="uiText('Search photo state...')"
                    class="w-full"
                  />
                </div>

                <div class="space-y-1">
                  <Label class="text-xs text-muted-foreground">{{ uiText('Org unit') }}</Label>
                  <SearchableSelect
                    v-model="filters.org_unit_id"
                    :options="orgUnitOptions"
                    :placeholder="uiText('All org units')"
                    :search-placeholder="uiText('Search org unit...')"
                    class="w-full"
                  />
                </div>

                <div class="space-y-1">
                  <Label class="text-xs text-muted-foreground">{{ uiText('Branch') }}</Label>
                  <SearchableSelect
                    v-model="filters.branch_id"
                    :options="branchOptions"
                    :placeholder="uiText('All branches')"
                    :search-placeholder="uiText('Search branch...')"
                    class="w-full"
                  />
                </div>

                <div class="space-y-1">
                  <Label class="text-xs text-muted-foreground">{{ uiText('Work location') }}</Label>
                  <SearchableSelect
                    v-model="filters.work_location_id"
                    :options="workLocationOptions"
                    :placeholder="uiText('All work locations')"
                    :search-placeholder="uiText('Search work location...')"
                    class="w-full"
                  />
                </div>
              </div>
            </div>

            <template #footer>
              <div class="flex items-center justify-between gap-3">
                <div class="text-xs text-muted-foreground">
                  {{ uiText(`${advancedFilterCount} advanced filters active`) }}
                </div>
                <div class="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="clearFilters"
                  >
                    {{ uiText('Reset all') }}
                  </Button>
                  <Button
                    size="sm"
                    @click="advancedFiltersOpen = false"
                  >
                    {{ uiText('Done') }}
                  </Button>
                </div>
              </div>
            </template>
          </FloatingPanel>

          <div class="w-full rounded-3xl border border-slate-900/10 bg-[linear-gradient(135deg,#0f172a_0%,#111827_52%,#1f2937_100%)] p-4 text-slate-50 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.95)] dark:border-slate-700/70 dark:shadow-[0_24px_56px_-28px_rgba(2,6,23,0.95)]">
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-1">
                <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200/90 dark:text-slate-200">
                  {{ uiText('Export queue') }}
                </p>
                <h3 class="text-base font-semibold leading-tight">
                  {{ uiText('Export attendance logs') }}
                </h3>
              </div>
              <Badge
                variant="secondary"
                class="rounded-full border-0 bg-white/12 px-2.5 py-1 text-[11px] font-medium text-white dark:bg-white/14"
              >
                XLSX
              </Badge>
            </div>

            <div class="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <div class="rounded-2xl border border-white/12 bg-white/12 px-3 py-2 dark:border-white/14 dark:bg-white/14">
                <div class="text-[11px] uppercase tracking-[0.18em] text-slate-200/85 dark:text-slate-200">
                  {{ uiText('Ready files') }}
                </div>
                <div class="mt-1 text-lg font-semibold">
                  {{ completedExportCount }}
                </div>
              </div>
              <div class="rounded-2xl border border-white/12 bg-white/12 px-3 py-2 dark:border-white/14 dark:bg-white/14">
                <div class="text-[11px] uppercase tracking-[0.18em] text-slate-200/85 dark:text-slate-200">
                  {{ uiText('In queue') }}
                </div>
                <div class="mt-1 text-lg font-semibold">
                  {{ pendingExportCount }}
                </div>
              </div>
            </div>

            <div class="mt-4 rounded-2xl border border-white/12 bg-white/8 px-3 py-3 dark:border-white/14 dark:bg-white/10">
              <div class="text-[11px] uppercase tracking-[0.18em] text-slate-200/85 dark:text-slate-200">
                {{ uiText('Current range') }}
              </div>
              <div class="mt-1 text-sm font-medium leading-5 text-slate-50">
                {{ dateRangeSummary }}
              </div>
            </div>

            <Button
              size="sm"
              class="mt-4 h-10 w-full border border-white/15 bg-white text-slate-950 hover:bg-slate-100"
              :disabled="exportLoading"
              @click="createExport"
            >
              {{ exportLoading ? uiText('Queueing...') : uiText('Export') }}
            </Button>

            <p class="mt-2 text-xs leading-5 text-slate-200/85 dark:text-slate-200/90">
              {{ uiText('Exports the current filtered attendance logs to XLSX.') }}
            </p>

            <div
              v-if="latestExport"
              class="mt-4 rounded-2xl border border-white/12 bg-black/15 px-3 py-3 text-xs text-slate-200/90 dark:border-white/14 dark:bg-black/20 dark:text-slate-200"
            >
              <div class="font-medium text-slate-50">
                {{ uiText('Latest request') }}
              </div>
              <div class="mt-1">
                {{ latestExport.requested_by_name }} • {{ formatTimestamp(latestExport.created_at) }}
              </div>
              <div class="mt-1">
                {{ uiText('Status') }}: {{ toTitleCase(latestExport.status) }}
              </div>
            </div>
            <p
              v-else
              class="mt-4 text-xs leading-5 text-slate-200/80 dark:text-slate-200/85"
            >
              {{ uiText('No export requests yet. Start one from the Export button above.') }}
            </p>
          </div>
        </div>
      </template>

      <template #filters>
        <div class="w-full min-w-0 rounded-[28px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.06),transparent_32%),linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))] p-4 shadow-[0_20px_60px_-50px_rgba(15,23,42,0.55)] dark:border-slate-700/80 dark:bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.12),transparent_36%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))] dark:shadow-[0_28px_70px_-56px_rgba(0,0,0,1)] sm:p-5">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="max-w-2xl">
              <div class="text-sm font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                {{ uiText('Refine attendance logs') }}
              </div>
              <div class="mt-1 text-xs leading-5 text-muted-foreground dark:text-slate-300">
                {{ uiText('Keep the primary filters visible and open advanced filters only when you need more precision.') }}
              </div>
            </div>
            <div class="grid min-w-[220px] gap-2 sm:grid-cols-2">
              <div class="rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/85">
                <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground dark:text-slate-300">
                  {{ uiText('Current range') }}
                </div>
                <div class="mt-1 text-sm font-medium text-slate-950 dark:text-slate-100">
                  {{ dateRangeSummary }}
                </div>
              </div>
              <div class="rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/85">
                <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground dark:text-slate-300">
                  {{ uiText('Primary filters') }}
                </div>
                <div class="mt-1 text-sm font-medium text-slate-950 dark:text-slate-100">
                  {{ primaryFilterCount }}
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {{ uiText(`${activeFilterCount} filters active`) }}
            </Badge>
            <Badge
              variant="outline"
              class="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {{ uiText(`${advancedFilterCount} advanced filters active`) }}
            </Badge>
            <div class="ml-auto flex items-center gap-2">
              <Badge
                v-if="pendingExportCount > 0"
                variant="outline"
                class="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
              >
                {{ pendingExportCount }} {{ uiText('In queue') }}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                class="rounded-full border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                @click="toggleAdvancedFilters"
              >
                {{ advancedFiltersOpen ? uiText('Hide advanced filters') : uiText('More filters') }}
                <span
                  v-if="advancedFilterCount > 0"
                  class="ml-1 text-xs text-muted-foreground"
                >
                  ({{ advancedFilterCount }})
                </span>
              </Button>
            </div>
          </div>

          <div class="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div class="space-y-1 lg:col-span-2">
              <Label class="text-xs text-muted-foreground">{{ uiText('Date range') }}</Label>
              <DateRangePicker
                v-model:from="filters.date_from"
                v-model:to="filters.date_to"
                :placeholder="uiText('Select attendance date range')"
              />
            </div>

            <div class="space-y-1">
              <Label class="text-xs text-muted-foreground">{{ uiText('Employee') }}</Label>
              <SearchableSelect
                v-model="filters.employee_id"
                :options="employeeOptions"
                :placeholder="uiText('All employees')"
                :search-placeholder="uiText('Search employees...')"
                class="w-full"
              />
            </div>

            <div class="space-y-1">
              <Label class="text-xs text-muted-foreground">{{ uiText('Exception') }}</Label>
              <SearchableSelect
                v-model="filters.exception_type"
                :options="exceptionOptions"
                :placeholder="uiText('All exceptions')"
                :search-placeholder="uiText('Search exception...')"
                class="w-full"
              />
            </div>

            <div class="space-y-1">
              <Label class="text-xs text-muted-foreground">{{ uiText('Status') }}</Label>
              <SearchableSelect
                v-model="filters.status"
                :options="statusOptions"
                :placeholder="uiText('All statuses')"
                :search-placeholder="uiText('Search status...')"
                class="w-full"
              />
            </div>
          </div>

          <div class="mt-4 rounded-2xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/80">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground dark:text-slate-300">
                  {{ uiText('Quick ranges') }}
                </div>
                <div class="mt-1 text-xs leading-5 text-muted-foreground dark:text-slate-300">
                  {{ uiText('Use quick presets for common audit windows.') }}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                class="h-8 rounded-full px-3 text-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                @click="clearFilters"
              >
                {{ uiText('Reset Filters') }}
              </Button>
            </div>

            <div class="mt-3 flex flex-wrap items-end gap-2">
              <Button
                variant="outline"
                size="sm"
                class="rounded-full border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                @click="applyDatePreset('today')"
              >
                {{ uiText('Today') }}
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="rounded-full border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                @click="applyDatePreset('yesterday')"
              >
                {{ uiText('Yesterday') }}
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="rounded-full border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                @click="applyDatePreset('this_week')"
              >
                {{ uiText('This Week') }}
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="rounded-full border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                @click="applyDatePreset('this_month')"
              >
                {{ uiText('This Month') }}
              </Button>
            </div>
          </div>

          <div
            v-if="activeFilterChips.length > 0"
            class="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-4 dark:border-slate-700"
          >
            <span class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:text-slate-300">{{ uiText('Active filters') }}</span>
            <button
              v-for="chip in activeFilterChips"
              :key="`${chip.key}:${chip.value}`"
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-700"
              @click="clearFilter(chip.key)"
            >
              <span class="font-semibold text-slate-900 dark:text-slate-50">{{ chip.label }}:</span>
              <span>{{ chip.value }}</span>
              <span class="text-muted-foreground">{{ uiText('Clear') }}</span>
            </button>
          </div>
        </div>
      </template>

      <template #row-actions="{ row, close }">
        <button
          v-if="hasSelfie(row)"
          class="w-full rounded px-3 py-2 text-left hover:bg-accent"
          @click="openSelfie(row); close()"
        >
          {{ uiText('View Photo') }}
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
                  {{ uiText('Attendance Log Detail') }}
                </div>
                <div class="text-sm text-muted-foreground">
                  {{ uiText('Review the attendance record with a cleaner summary, supporting context, and photo proof.') }}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                @click="close"
              >
                {{ uiText('Close') }}
              </Button>
            </div>

            <div class="grid max-h-[calc(90vh-73px)] gap-0 overflow-auto lg:grid-cols-[minmax(0,1fr)_360px]">
              <div class="space-y-5 px-5 py-5 sm:px-6">
                <div
                  v-if="loading"
                  class="rounded-xl border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground"
                >
                  {{ uiText('Loading attendance detail...') }}
                </div>

                <template v-else>
                  <div class="rounded-2xl border bg-muted/20 p-4 sm:p-5">
                    <div class="flex flex-wrap items-start justify-between gap-4">
                      <div class="space-y-2">
                        <div class="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          {{ uiText('Attendance Summary') }}
                        </div>
                        <div class="text-xl font-semibold leading-tight">
                          {{ String(row?.employee_name ?? uiText('Unknown Employee')) }}
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
                        {{ uiText('No data available in this section.') }}
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
                            :title="uiText('Attendance Location Map')"
                          />
                        </div>

                        <div class="flex justify-end">
                          <a
                            :href="getMapsUrl(row)"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-accent"
                          >
                            {{ uiText('Open Coordinates in Maps') }}
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
                      {{ uiText('Photo Proof') }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ uiText('Use the photo to quickly verify that the record matches the employee submission.') }}
                    </div>
                  </div>

                  <div
                    v-if="loading"
                    class="rounded-xl border border-dashed p-6 text-sm text-muted-foreground"
                  >
                    {{ uiText('Loading photo...') }}
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
                          {{ uiText('Photo Status') }}
                        </div>
                        <div class="mt-1 text-sm font-medium">
                          {{ uiText('Available') }}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        class="w-full"
                        @click="openSelfie(row)"
                      >
                        {{ uiText('Open Full Size') }}
                      </Button>
                    </div>
                  </div>
                  <div
                    v-else
                    class="rounded-2xl border border-dashed bg-background p-6 text-sm text-muted-foreground"
                  >
                    {{ uiText('No photo proof is attached to this attendance log.') }}
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
            <CardTitle>{{ uiText('Recent Exports') }}</CardTitle>
            <Badge
              variant="secondary"
              class="rounded-full px-3 py-1 text-xs"
            >
              {{ exportItems.length }}
            </Badge>
          </div>
          <p class="text-sm leading-6 text-muted-foreground dark:text-slate-300">
            {{ uiText('Exports follow the active filters at the time the request is created and will appear here once the file is ready to download.') }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            class="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
          >
            {{ completedExportCount }} {{ uiText('Ready files') }}
          </Badge>
          <Badge
            variant="outline"
            class="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
          >
            {{ pendingExportCount }} {{ uiText('In queue') }}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            class="rounded-full px-4"
            :disabled="exportListLoading"
            @click="loadExports"
          >
            {{ uiText('Refresh') }}
          </Button>
        </div>
      </CardHeader>
      <CardContent class="space-y-4 pt-5">
        <div
          v-if="exportListLoading && exportItems.length === 0"
          class="text-sm text-muted-foreground"
        >
          {{ uiText('Loading recent exports...') }}
        </div>

        <div
          v-else-if="exportItems.length === 0"
          class="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5 text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
        >
          {{ uiText('No export requests yet. Start one from the Export button above.') }}
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
                      {{ uiText('Requested') }}
                    </div>
                    <div class="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {{ formatTimestamp(item.created_at) }}
                    </div>
                  </div>
                  <div class="rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/75">
                    <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:text-slate-300">
                      {{ uiText('Started') }}
                    </div>
                    <div class="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {{ formatTimestamp(item.started_at) }}
                    </div>
                  </div>
                  <div class="rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/75">
                    <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:text-slate-300">
                      {{ uiText('Completed') }}
                    </div>
                    <div class="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {{ formatTimestamp(item.completed_at) }}
                    </div>
                  </div>
                  <div class="rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/75">
                    <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:text-slate-300">
                      {{ uiText('Expires') }}
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
                  {{ uiText('Download') }}
                </Button>
                <span
                  v-else
                  class="rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300"
                >
                  {{ item.status === 'failed' ? uiText('Generation failed') : uiText('Waiting for file') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

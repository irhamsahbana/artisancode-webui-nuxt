<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

import type { ApiResponse, ListResponse } from '~/types/api'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'

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

type ExportJobFormat = 'csv' | 'xlsx' | 'pdf'
type ExportJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired'

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

      return new Date(value).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    },
  },
  {
    key: 'selfie_url',
    label: 'Photo Proof',
    format: (value: unknown) => (typeof value === 'string' && value.length > 0 ? 'Available' : '-'),
  },
]

const withAnyOption = (label: string, options: SelectOption[]) => [{ value: '', label }, ...options]

const typeOptions = withAnyOption('All types', [
  { value: 'check_in', label: 'Check In' },
  { value: 'check_out', label: 'Check Out' },
])

const sourceOptions = withAnyOption('All sources', [
  { value: 'mobile', label: 'Mobile' },
  { value: 'web', label: 'Web' },
])

const statusOptions = withAnyOption('All statuses', [
  { value: 'recorded', label: 'Recorded' },
])

const selfieOptions = withAnyOption('All photo states', [
  { value: 'with_photo', label: 'With Photo' },
  { value: 'without_photo', label: 'Without Photo' },
])

const exceptionOptions = withAnyOption('All exceptions', [
  { value: 'late_check_in', label: 'Late Check In' },
  { value: 'missing_check_out', label: 'Missing Check Out' },
  { value: 'missing_check_in', label: 'Missing Check In' },
])

const employeeOptions = ref<SelectOption[]>(withAnyOption('All employees', []))
const orgUnitOptions = ref<SelectOption[]>(withAnyOption('All org units', []))
const branchOptions = ref<SelectOption[]>(withAnyOption('All branches', []))
const workLocationOptions = ref<SelectOption[]>(withAnyOption('All work locations', []))
const exportLoading = ref(false)
const exportListLoading = ref(false)
const exportItems = ref<ExportJob[]>([])
const exportFormat = ref<ExportJobFormat>('csv')
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
const advancedFiltersOpen = ref(false)

const getOptionLabel = (options: SelectOption[], value: string) =>
  options.find(option => option.value === value)?.label ?? value

const activeFilterChips = computed(() => {
  const chips: Array<{ key: keyof typeof filters, label: string, value: string }> = []

  if (filters.date_from || filters.date_to) {
    chips.push({
      key: filters.date_from ? 'date_from' : 'date_to',
      label: 'Date range',
      value:
        filters.date_from && filters.date_to
          ? filters.date_from === filters.date_to
            ? filters.date_from
            : `${filters.date_from} to ${filters.date_to}`
          : (filters.date_from || filters.date_to),
    })
  }

  const optionLookups: Array<{ key: keyof typeof filters, label: string, options: SelectOption[] }> = [
    { key: 'employee_id', label: 'Employee', options: employeeOptions.value },
    { key: 'exception_type', label: 'Exception', options: exceptionOptions },
    { key: 'status', label: 'Status', options: statusOptions },
    { key: 'type', label: 'Type', options: typeOptions },
    { key: 'source', label: 'Source', options: sourceOptions },
    { key: 'selfie_status', label: 'Photo proof', options: selfieOptions },
    { key: 'org_unit_id', label: 'Org unit', options: orgUnitOptions.value },
    { key: 'branch_id', label: 'Branch', options: branchOptions.value },
    { key: 'work_location_id', label: 'Work location', options: workLocationOptions.value },
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
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
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
      format: exportFormat.value,
      ...buildFilterQuery(),
    },
  })
  exportLoading.value = false

  if (!response.success) {
    return
  }

  show(`Attendance export queued as ${exportFormat.value.toUpperCase()}.`, 'success')
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
      loading-variant="skeleton"
      :can-delete="false"
    >
      <template #header-actions>
        <div class="flex flex-wrap items-center justify-end gap-2">
          <FloatingPanel
            v-model:open="advancedFiltersOpen"
            title="Advanced filters"
            description="Apply more specific conditions without changing the table layout."
            width-class="w-full max-w-lg"
          >
            <div class="space-y-4">
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-1">
                  <Label class="text-xs text-muted-foreground">Type</Label>
                  <SearchableSelect
                    v-model="filters.type"
                    :options="typeOptions"
                    placeholder="All types"
                    search-placeholder="Search type..."
                    class="w-full"
                  />
                </div>

                <div class="space-y-1">
                  <Label class="text-xs text-muted-foreground">Source</Label>
                  <SearchableSelect
                    v-model="filters.source"
                    :options="sourceOptions"
                    placeholder="All sources"
                    search-placeholder="Search source..."
                    class="w-full"
                  />
                </div>

                <div class="space-y-1">
                  <Label class="text-xs text-muted-foreground">Photo proof</Label>
                  <SearchableSelect
                    v-model="filters.selfie_status"
                    :options="selfieOptions"
                    placeholder="All photo states"
                    search-placeholder="Search photo state..."
                    class="w-full"
                  />
                </div>

                <div class="space-y-1">
                  <Label class="text-xs text-muted-foreground">Org unit</Label>
                  <SearchableSelect
                    v-model="filters.org_unit_id"
                    :options="orgUnitOptions"
                    placeholder="All org units"
                    search-placeholder="Search org unit..."
                    class="w-full"
                  />
                </div>

                <div class="space-y-1">
                  <Label class="text-xs text-muted-foreground">Branch</Label>
                  <SearchableSelect
                    v-model="filters.branch_id"
                    :options="branchOptions"
                    placeholder="All branches"
                    search-placeholder="Search branch..."
                    class="w-full"
                  />
                </div>

                <div class="space-y-1">
                  <Label class="text-xs text-muted-foreground">Work location</Label>
                  <SearchableSelect
                    v-model="filters.work_location_id"
                    :options="workLocationOptions"
                    placeholder="All work locations"
                    search-placeholder="Search work location..."
                    class="w-full"
                  />
                </div>
              </div>
            </div>

            <template #footer>
              <div class="flex items-center justify-between gap-3">
                <div class="text-xs text-muted-foreground">
                  {{ advancedFilterCount }} advanced filters active
                </div>
                <div class="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="clearFilters"
                  >
                    Reset all
                  </Button>
                  <Button
                    size="sm"
                    @click="advancedFiltersOpen = false"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </template>
          </FloatingPanel>

          <SearchableSelect
            v-model="exportFormat"
            :options="[
              { value: 'csv', label: 'CSV' },
              { value: 'xlsx', label: 'XLSX' },
              { value: 'pdf', label: 'PDF' },
            ]"
            placeholder="Export format"
            class="w-[140px]"
          />
          <Button
            size="sm"
            :disabled="exportLoading"
            @click="createExport"
          >
            {{ exportLoading ? 'Queueing...' : `Export ${exportFormat.toUpperCase()}` }}
          </Button>
        </div>
      </template>

      <template #filters>
        <div class="w-full space-y-3 rounded-xl border bg-muted/20 p-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div class="text-sm font-medium">
                Refine attendance logs
              </div>
              <div class="text-xs text-muted-foreground">
                Keep the primary filters visible and open advanced filters only when you need more precision.
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Badge
                variant="secondary"
                class="rounded-full px-3 py-1 text-xs"
              >
                {{ activeFilterCount }} filters active
              </Badge>
              <Button
                variant="outline"
                size="sm"
                @click="toggleAdvancedFilters"
              >
                {{ advancedFiltersOpen ? 'Hide advanced filters' : 'More filters' }}
                <span
                  v-if="advancedFilterCount > 0"
                  class="ml-1 text-xs text-muted-foreground"
                >
                  ({{ advancedFilterCount }})
                </span>
              </Button>
            </div>
          </div>

          <div class="grid gap-3 lg:grid-cols-5">
            <div class="space-y-1 lg:col-span-2">
              <Label class="text-xs text-muted-foreground">Date range</Label>
              <DateRangePicker
                v-model:from="filters.date_from"
                v-model:to="filters.date_to"
                placeholder="Select attendance date range"
              />
            </div>

            <div class="space-y-1">
              <Label class="text-xs text-muted-foreground">Employee</Label>
              <SearchableSelect
                v-model="filters.employee_id"
                :options="employeeOptions"
                placeholder="All employees"
                search-placeholder="Search employees..."
                class="w-full"
              />
            </div>

            <div class="space-y-1">
              <Label class="text-xs text-muted-foreground">Exception</Label>
              <SearchableSelect
                v-model="filters.exception_type"
                :options="exceptionOptions"
                placeholder="All exceptions"
                search-placeholder="Search exception..."
                class="w-full"
              />
            </div>

            <div class="space-y-1">
              <Label class="text-xs text-muted-foreground">Status</Label>
              <SearchableSelect
                v-model="filters.status"
                :options="statusOptions"
                placeholder="All statuses"
                search-placeholder="Search status..."
                class="w-full"
              />
            </div>
          </div>

          <div class="flex flex-wrap items-end gap-2">
            <Button
              variant="outline"
              size="sm"
              @click="applyDatePreset('today')"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="applyDatePreset('yesterday')"
            >
              Yesterday
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="applyDatePreset('this_week')"
            >
              This Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="applyDatePreset('this_month')"
            >
              This Month
            </Button>
            <Button
              variant="ghost"
              size="sm"
              @click="clearFilters"
            >
              Reset Filters
            </Button>
          </div>

          <div
            v-if="activeFilterChips.length > 0"
            class="flex flex-wrap items-center gap-2 border-t pt-3"
          >
            <span class="text-xs font-medium text-muted-foreground">Active filters</span>
            <button
              v-for="chip in activeFilterChips"
              :key="`${chip.key}:${chip.value}`"
              type="button"
              class="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs hover:bg-accent"
              @click="clearFilter(chip.key)"
            >
              <span class="font-medium">{{ chip.label }}:</span>
              <span>{{ chip.value }}</span>
              <span class="text-muted-foreground">Clear</span>
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
          View Photo
        </button>
      </template>

      <template #detail="{ row, loading, close, entries, formatValue }">
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6 py-8"
          @click.self="close"
        >
          <div class="w-full max-w-5xl rounded-lg border bg-card p-6 shadow-lg">
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="text-lg font-semibold">
                  Attendance Log Detail
                </div>
                <div class="text-sm text-muted-foreground">
                  Review the attendance record and its photo proof.
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                @click="close"
              >
                Close
              </Button>
            </div>

            <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div class="rounded-xl border bg-muted/20 p-4">
                <div class="text-sm font-medium">
                  Photo Proof
                </div>
                <div
                  v-if="loading"
                  class="mt-4 text-sm text-muted-foreground"
                >
                  Loading photo...
                </div>
                <div
                  v-else-if="hasSelfie(row)"
                  class="mt-4 space-y-4"
                >
                  <img
                    :src="getSelfieUrl(row)"
                    alt="Attendance photo proof"
                    class="max-h-[60vh] w-full rounded-lg border object-contain bg-white"
                  >
                  <div class="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      @click="openSelfie(row)"
                    >
                      Open Full Size
                    </Button>
                  </div>
                </div>
                <div
                  v-else
                  class="mt-4 rounded-lg border border-dashed p-6 text-sm text-muted-foreground"
                >
                  No photo proof is attached to this attendance log.
                </div>
              </div>

              <div class="rounded-xl border p-4">
                <div class="text-sm font-medium">
                  Record Details
                </div>
                <div class="mt-4 max-h-[60vh] overflow-auto text-sm">
                  <div
                    v-if="loading"
                    class="text-muted-foreground"
                  >
                    Loading...
                  </div>
                  <div
                    v-else-if="entries.length === 0"
                    class="text-muted-foreground"
                  >
                    No detail available.
                  </div>
                  <div
                    v-else
                    class="space-y-3"
                  >
                    <div
                      v-for="[key, value] in entries"
                      :key="String(key)"
                      class="grid grid-cols-[120px_minmax(0,1fr)] gap-3"
                    >
                      <div class="break-words text-muted-foreground">
                        {{ key }}
                      </div>
                      <div class="break-words">
                        {{ formatValue(value) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </ResourceList>

    <Card class="shadow-sm">
      <CardHeader class="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Recent Exports</CardTitle>
          <p class="text-sm text-muted-foreground">
            Export mengikuti filter aktif saat request dibuat dan akan muncul di sini ketika file siap diunduh.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          :disabled="exportListLoading"
          @click="loadExports"
        >
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div
          v-if="exportListLoading && exportItems.length === 0"
          class="text-sm text-muted-foreground"
        >
          Loading recent exports...
        </div>

        <div
          v-else-if="exportItems.length === 0"
          class="rounded-lg border border-dashed p-4 text-sm text-muted-foreground"
        >
          No export requests yet. Start one from the Export button above.
        </div>

        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="item in exportItems"
            :key="item.id"
            class="rounded-xl border p-4"
          >
            <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div class="space-y-2">
                <div class="flex flex-wrap items-center gap-2">
                  <Badge :variant="getExportStatusVariant(item.status)">
                    {{ toTitleCase(item.status) }}
                  </Badge>
                  <Badge variant="secondary">
                    {{ item.format.toUpperCase() }}
                  </Badge>
                  <span class="text-sm font-medium">
                    {{ item.requested_by_name }}
                  </span>
                </div>

                <div class="grid gap-1 text-sm text-muted-foreground">
                  <div>Requested: {{ formatTimestamp(item.created_at) }}</div>
                  <div>Started: {{ formatTimestamp(item.started_at) }}</div>
                  <div>Completed: {{ formatTimestamp(item.completed_at) }}</div>
                  <div>Expires: {{ formatTimestamp(item.expires_at) }}</div>
                </div>

                <p
                  v-if="item.error_message"
                  class="text-sm text-destructive"
                >
                  {{ item.error_message }}
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <Button
                  v-if="item.download_url"
                  size="sm"
                  @click="downloadExport(item)"
                >
                  Download
                </Button>
                <span
                  v-else
                  class="text-sm text-muted-foreground"
                >
                  {{ item.status === 'failed' ? 'Generation failed' : 'Waiting for file' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

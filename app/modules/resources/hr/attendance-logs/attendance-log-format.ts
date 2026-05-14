import type { AttendanceLogFilters, AttendanceLogRow, DatePreset, ExportJobStatus } from './types'

export const attendanceLogFilterKeys = [
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
] as const satisfies readonly (keyof AttendanceLogFilters)[]

export const createEmptyAttendanceLogFilters = (): AttendanceLogFilters => ({
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

export const getStringQueryValue = (
  query: Record<string, unknown>,
  key: string,
) => {
  const value = query[key]
  return typeof value === 'string' ? value : ''
}

export const filtersFromQuery = (query: Record<string, unknown>) => {
  const attendanceDate = getStringQueryValue(query, 'attendance_date')

  return {
    date_from: getStringQueryValue(query, 'date_from') || attendanceDate,
    date_to: getStringQueryValue(query, 'date_to') || attendanceDate,
    type: getStringQueryValue(query, 'type'),
    source: getStringQueryValue(query, 'source'),
    employee_id: getStringQueryValue(query, 'employee_id'),
    status: getStringQueryValue(query, 'status'),
    selfie_status: getStringQueryValue(query, 'selfie_status'),
    org_unit_id: getStringQueryValue(query, 'org_unit_id'),
    branch_id: getStringQueryValue(query, 'branch_id'),
    work_location_id: getStringQueryValue(query, 'work_location_id'),
    exception_type: getStringQueryValue(query, 'exception_type'),
  }
}

export const buildAttendanceLogFilterQuery = (filters: AttendanceLogFilters) => {
  const result: Record<string, string> = {}

  attendanceLogFilterKeys.forEach((key) => {
    const value = filters[key]
    if (typeof value === 'string' && value.length > 0) {
      result[key] = value
    }
  })

  return result
}

export const pickAttendanceLogFilterQuery = (query: Record<string, unknown>) => Object.fromEntries(
  attendanceLogFilterKeys.flatMap((key) => {
    const value = query[key]
    return typeof value === 'string' && value.length > 0 ? [[key, value]] : []
  }),
) as Record<string, string>

export const areQueriesEqual = (
  left: Record<string, string>,
  right: Record<string, string>,
) => {
  const leftKeys = Object.keys(left).sort()
  const rightKeys = Object.keys(right).sort()
  if (leftKeys.length !== rightKeys.length) {
    return false
  }

  return leftKeys.every(key => left[key] === right[key])
}

export const toLocalDateInputValue = (date: Date) => {
  const timezoneOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

export const shiftDate = (value: string, days: number) => {
  const date = new Date(`${value}T00:00:00`)
  date.setDate(date.getDate() + days)
  return toLocalDateInputValue(date)
}

export const getWeekStart = (todayValue: string) => {
  const date = new Date(`${todayValue}T00:00:00`)
  const currentDay = date.getDay()
  const diff = currentDay === 0 ? -6 : 1 - currentDay
  date.setDate(date.getDate() + diff)
  return toLocalDateInputValue(date)
}

export const getMonthStart = (todayValue: string) => {
  const date = new Date(`${todayValue}T00:00:00`)
  date.setDate(1)
  return toLocalDateInputValue(date)
}

export const getDatePresetRange = (
  preset: DatePreset,
  todayValue = toLocalDateInputValue(new Date()),
) => {
  if (preset === 'today') {
    return {
      date_from: todayValue,
      date_to: todayValue,
    }
  }

  if (preset === 'yesterday') {
    const yesterday = shiftDate(todayValue, -1)
    return {
      date_from: yesterday,
      date_to: yesterday,
    }
  }

  if (preset === 'this_week') {
    return {
      date_from: getWeekStart(todayValue),
      date_to: todayValue,
    }
  }

  return {
    date_from: getMonthStart(todayValue),
    date_to: todayValue,
  }
}

export const isDatePresetActive = (
  filters: AttendanceLogFilters,
  preset: DatePreset,
  todayValue = toLocalDateInputValue(new Date()),
) => {
  const range = getDatePresetRange(preset, todayValue)
  return filters.date_from === range.date_from && filters.date_to === range.date_to
}

export const toTitleCase = (value: string) => (
  value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
)

export const formatTitleValue = (value: unknown) => {
  if (typeof value !== 'string' || value.length === 0) {
    return '-'
  }

  return toTitleCase(value)
}

export const formatCoordinate = (value: unknown) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-'
  }

  return value.toFixed(6)
}

export const getSelfieUrl = (row: AttendanceLogRow | null | undefined) => {
  if (!row) {
    return ''
  }

  const value = row.selfie_url
  return typeof value === 'string' ? value : ''
}

export const hasSelfie = (row: AttendanceLogRow | null | undefined) => getSelfieUrl(row).length > 0

export const getDetailValue = (
  row: AttendanceLogRow | null | undefined,
  key: string,
) => row?.[key]

export const getMapsUrl = (row: AttendanceLogRow | null | undefined) => {
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

export const hasLocationCoordinates = (row: AttendanceLogRow | null | undefined) => getMapsUrl(row).length > 0

export const getMapEmbedUrl = (row: AttendanceLogRow | null | undefined) => {
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
  const formatMapCoordinate = (value: number) => Number(value.toFixed(6))
  const bbox = [
    formatMapCoordinate(longitude - longitudeOffset),
    formatMapCoordinate(latitude - latitudeOffset),
    formatMapCoordinate(longitude + longitudeOffset),
    formatMapCoordinate(latitude + latitudeOffset),
  ].join('%2C')

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`
}

export const getExportStatusVariant = (status: ExportJobStatus) => {
  if (status === 'completed') {
    return 'default'
  }

  if (status === 'failed' || status === 'expired') {
    return 'destructive'
  }

  return 'secondary'
}

type FormatDetailValueOptions = {
  formatAttendanceDate: (value: unknown) => string
  formatTimestamp: (value: string | null | undefined) => string
  availableLabel: string
}

export const formatDetailValue = (
  key: string,
  value: unknown,
  options: FormatDetailValueOptions,
) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (key === 'type' || key === 'source' || key === 'status') {
    return formatTitleValue(value)
  }

  if (key === 'attendance_date') {
    return options.formatAttendanceDate(value)
  }

  if (key === 'logged_at' || key === 'created_at' || key === 'updated_at') {
    return typeof value === 'string' ? options.formatTimestamp(value) : '-'
  }

  if (key === 'latitude' || key === 'longitude') {
    return formatCoordinate(value)
  }

  if (key === 'selfie_url') {
    return typeof value === 'string' && value.length > 0 ? options.availableLabel : '-'
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

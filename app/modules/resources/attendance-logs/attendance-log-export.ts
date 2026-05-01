import type { AttendanceLogFilters, ExportJob } from './types'

export const isExportInProgress = (item: Pick<ExportJob, 'status'>) => (
  item.status === 'pending' || item.status === 'processing'
)

export const countCompletedExports = (items: Pick<ExportJob, 'status'>[]) => (
  items.filter(item => item.status === 'completed').length
)

export const countPendingExports = (items: Pick<ExportJob, 'status'>[]) => (
  items.filter(isExportInProgress).length
)

export const shouldPollExports = (items: Pick<ExportJob, 'status'>[]) => (
  items.some(isExportInProgress)
)

export const buildExportMenuItems = (
  loading: boolean,
  labels: {
    queueing: string
    export: string
  },
) => [
  {
    key: 'export',
    label: loading ? labels.queueing : labels.export,
    disabled: loading,
  },
]

export const buildAttendanceExportPayload = (filters: AttendanceLogFilters) => ({
  resource_type: 'attendance_logs',
  format: 'xlsx',
  ...Object.fromEntries(
    Object.entries(filters).filter(([, value]) => typeof value === 'string' && value.length > 0),
  ),
})

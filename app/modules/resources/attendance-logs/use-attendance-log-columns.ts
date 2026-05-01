import { computed } from 'vue'

export type AttendanceLogColumn = {
  key: string
  label: string
  format?: (
    value: unknown,
    row: Record<string, unknown>,
  ) => string | { label: string, class?: string }
}

type Translate = (key: string) => string

type FormatDateTime = (
  value: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback?: string,
) => string

type UseAttendanceLogColumnsOptions = {
  t: Translate
  formatDateTime: FormatDateTime
}

const toTitleCase = (value: unknown) => (
  String(value ?? '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
)

export const useAttendanceLogColumns = ({
  t,
  formatDateTime,
}: UseAttendanceLogColumnsOptions) => computed<AttendanceLogColumn[]>(() => [
  { key: 'employee_no', label: t('ui.employeeNo') },
  { key: 'employee_name', label: t('ui.employeeName') },
  {
    key: 'type',
    label: t('ui.type'),
    format: value => toTitleCase(value),
  },
  {
    key: 'source',
    label: t('ui.source'),
    format: value => toTitleCase(value),
  },
  {
    key: 'status',
    label: t('ui.status'),
    format: value => toTitleCase(value),
  },
  { key: 'attendance_date', label: t('ui.date') },
  {
    key: 'logged_at',
    label: t('ui.loggedAt'),
    format: (value) => {
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
    format: value => (typeof value === 'string' && value.length > 0 ? t('ui.available') : '-'),
  },
])

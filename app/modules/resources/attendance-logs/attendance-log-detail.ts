import type { AttendanceLogRow } from './types'

export type AttendanceLogDetailSection = {
  id: string
  title: string
  description: string
  fields: string[]
}

export type AttendanceLogDetailEntry = {
  key: string
  label: string
  value: string
  multiline: boolean
}

type Translate = (key: string) => string

type BuildDetailOptions = {
  t: Translate
  formatAttendanceDate: (value: unknown) => string
  formatDetailValue: (key: string, value: unknown) => string
}

export const attendanceLogDetailFieldLabels: Record<string, string> = {
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

const getDetailValue = (
  row: AttendanceLogRow | null | undefined,
  key: string,
) => row?.[key]

const toTitleCase = (value: string) => (
  value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
)

export const getAttendanceLogDetailFieldLabel = (
  key: string,
  t: Translate,
) => {
  const labelKey = attendanceLogDetailFieldLabels[key]
  return labelKey ? t(labelKey) : toTitleCase(key)
}

export const buildAttendanceLogDetailSummary = (
  row: AttendanceLogRow | null | undefined,
  options: BuildDetailOptions,
) => {
  if (!row) {
    return []
  }

  return [
    {
      key: 'attendance_date',
      label: options.t('ui.attendanceDate'),
      value: typeof getDetailValue(row, 'attendance_date') === 'string'
        ? options.formatAttendanceDate(getDetailValue(row, 'attendance_date'))
        : '-',
    },
    {
      key: 'logged_at',
      label: options.t('ui.loggedAt'),
      value: options.formatDetailValue('logged_at', getDetailValue(row, 'logged_at')),
    },
    {
      key: 'type',
      label: options.t('ui.type'),
      value: options.formatDetailValue('type', getDetailValue(row, 'type')),
    },
    {
      key: 'source',
      label: options.t('ui.source'),
      value: options.formatDetailValue('source', getDetailValue(row, 'source')),
    },
  ].filter(item => item.value !== '-')
}

export const createAttendanceLogDetailSections = (t: Translate): AttendanceLogDetailSection[] => [
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

export const getAttendanceLogSectionEntries = (
  row: AttendanceLogRow | null | undefined,
  fields: string[],
  options: Pick<BuildDetailOptions, 't' | 'formatDetailValue'>,
) => {
  if (!row) {
    return []
  }

  return fields
    .map((key) => {
      const value = getDetailValue(row, key)
      const formattedValue = options.formatDetailValue(key, value)

      if (formattedValue === '-') {
        return null
      }

      return {
        key,
        label: getAttendanceLogDetailFieldLabel(key, options.t),
        value: formattedValue,
        multiline: key === 'notes' || key === 'address' || (typeof value === 'object' && value !== null),
      }
    })
    .filter((item): item is AttendanceLogDetailEntry => item !== null)
}

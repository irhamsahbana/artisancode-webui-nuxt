import assert from 'node:assert/strict'
import test from 'node:test'

const {
  buildAttendanceLogDetailSummary,
  createAttendanceLogDetailSections,
  getAttendanceLogDetailFieldLabel,
  getAttendanceLogSectionEntries,
} = await import(new URL('./attendance-log-detail.ts', import.meta.url).href)

type DetailSection = {
  id: string
  title: string
  fields: string[]
}

const t = (key: string) => `t:${key}`

const detailOptions = {
  t,
  formatAttendanceDate: (value: unknown) => `date:${String(value)}`,
  formatDetailValue: (key: string, value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return '-'
    }

    return `${key}:${String(value)}`
  },
}

test('builds attendance detail summary and removes empty values', () => {
  assert.deepEqual(buildAttendanceLogDetailSummary(null, detailOptions), [])
  assert.deepEqual(buildAttendanceLogDetailSummary({
    attendance_date: '2026-05-01',
    logged_at: '2026-05-01T08:00:00Z',
    type: 'check_in',
    source: '',
  }, detailOptions), [
    {
      key: 'attendance_date',
      label: 't:ui.attendanceDate',
      value: 'date:2026-05-01',
    },
    {
      key: 'logged_at',
      label: 't:ui.loggedAt',
      value: 'logged_at:2026-05-01T08:00:00Z',
    },
    {
      key: 'type',
      label: 't:ui.type',
      value: 'type:check_in',
    },
  ])
})

test('creates stable attendance detail sections', () => {
  const sections = createAttendanceLogDetailSections(t)

  assert.deepEqual(sections.map((section: DetailSection) => section.id), [
    'employee',
    'attendance',
    'location',
    'device',
    'system',
  ])
  assert.deepEqual(sections[1]?.fields, [
    'attendance_date',
    'logged_at',
    'type',
    'source',
    'status',
    'notes',
  ])
  assert.equal(sections[0]?.title, 't:ui.employeeInformation')
})

test('resolves detail labels from locale keys or title-cased fallback', () => {
  assert.equal(getAttendanceLogDetailFieldLabel('employee_name', t), 't:ui.employeeName')
  assert.equal(getAttendanceLogDetailFieldLabel('custom_field_name', t), 'Custom Field Name')
})

test('builds section entries with multiline metadata and removes empty values', () => {
  assert.deepEqual(getAttendanceLogSectionEntries(null, ['notes'], detailOptions), [])
  assert.deepEqual(getAttendanceLogSectionEntries({
    notes: 'Needs review',
    address: 'Main road',
    payload: { ok: true },
    source: '',
  }, ['notes', 'address', 'payload', 'source'], detailOptions), [
    {
      key: 'notes',
      label: 't:ui.notes',
      value: 'notes:Needs review',
      multiline: true,
    },
    {
      key: 'address',
      label: 't:ui.recordedAddress',
      value: 'address:Main road',
      multiline: true,
    },
    {
      key: 'payload',
      label: 'Payload',
      value: 'payload:[object Object]',
      multiline: true,
    },
  ])
})

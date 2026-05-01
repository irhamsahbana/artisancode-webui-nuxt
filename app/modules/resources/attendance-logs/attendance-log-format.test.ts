import assert from 'node:assert/strict'
import test from 'node:test'

const {
  areQueriesEqual,
  buildAttendanceLogFilterQuery,
  createEmptyAttendanceLogFilters,
  filtersFromQuery,
  formatCoordinate,
  formatDetailValue,
  formatTitleValue,
  getDatePresetRange,
  getExportStatusVariant,
  getMapEmbedUrl,
  getMapsUrl,
  getSelfieUrl,
  hasLocationCoordinates,
  hasSelfie,
  isDatePresetActive,
  pickAttendanceLogFilterQuery,
  shiftDate,
  toTitleCase,
} = await import(new URL('./attendance-log-format.ts', import.meta.url).href)

const formatOptions = {
  availableLabel: 'Available',
  formatAttendanceDate: (value: unknown) => `date:${String(value)}`,
  formatTimestamp: (value: string | null | undefined) => `time:${String(value)}`,
}

test('builds attendance log filters from route query and strips empty values', () => {
  assert.deepEqual(filtersFromQuery({
    attendance_date: '2026-05-01',
    date_from: '',
    type: 'check_in',
    status: ['recorded'],
  }), {
    ...createEmptyAttendanceLogFilters(),
    date_from: '2026-05-01',
    date_to: '2026-05-01',
    type: 'check_in',
  })

  assert.deepEqual(buildAttendanceLogFilterQuery({
    ...createEmptyAttendanceLogFilters(),
    date_from: '2026-05-01',
    employee_id: 'emp-1',
  }), {
    date_from: '2026-05-01',
    employee_id: 'emp-1',
  })

  assert.deepEqual(pickAttendanceLogFilterQuery({
    date_from: '2026-05-01',
    q: 'ignored',
    type: '',
    source: 'mobile',
  }), {
    date_from: '2026-05-01',
    source: 'mobile',
  })
})

test('compares query objects without depending on key order', () => {
  assert.equal(areQueriesEqual({ a: '1', b: '2' }, { b: '2', a: '1' }), true)
  assert.equal(areQueriesEqual({ a: '1' }, { a: '1', b: '2' }), false)
  assert.equal(areQueriesEqual({ a: '1' }, { a: '2' }), false)
})

test('resolves attendance date preset ranges', () => {
  assert.deepEqual(getDatePresetRange('today', '2026-05-01'), {
    date_from: '2026-05-01',
    date_to: '2026-05-01',
  })
  assert.deepEqual(getDatePresetRange('yesterday', '2026-05-01'), {
    date_from: '2026-04-30',
    date_to: '2026-04-30',
  })
  assert.deepEqual(getDatePresetRange('this_week', '2026-05-01'), {
    date_from: '2026-04-27',
    date_to: '2026-05-01',
  })
  assert.deepEqual(getDatePresetRange('this_month', '2026-05-01'), {
    date_from: '2026-05-01',
    date_to: '2026-05-01',
  })
  assert.equal(shiftDate('2026-03-01', -1), '2026-02-28')
})

test('detects active attendance date presets', () => {
  assert.equal(isDatePresetActive({
    ...createEmptyAttendanceLogFilters(),
    date_from: '2026-04-27',
    date_to: '2026-05-01',
  }, 'this_week', '2026-05-01'), true)
  assert.equal(isDatePresetActive({
    ...createEmptyAttendanceLogFilters(),
    date_from: '2026-04-28',
    date_to: '2026-05-01',
  }, 'this_week', '2026-05-01'), false)
})

test('formats attendance log primitive values', () => {
  assert.equal(toTitleCase('late_check_in'), 'Late Check In')
  assert.equal(formatTitleValue('check_out'), 'Check Out')
  assert.equal(formatTitleValue(''), '-')
  assert.equal(formatCoordinate(-8.12345678), '-8.123457')
  assert.equal(formatCoordinate('invalid'), '-')
})

test('formats attendance log detail values by key', () => {
  assert.equal(formatDetailValue('type', 'check_in', formatOptions), 'Check In')
  assert.equal(formatDetailValue('attendance_date', '2026-05-01', formatOptions), 'date:2026-05-01')
  assert.equal(formatDetailValue('logged_at', '2026-05-01T08:00:00Z', formatOptions), 'time:2026-05-01T08:00:00Z')
  assert.equal(formatDetailValue('latitude', -8.5, formatOptions), '-8.500000')
  assert.equal(formatDetailValue('selfie_url', 'https://example.test/photo.jpg', formatOptions), 'Available')
  assert.equal(formatDetailValue('payload', { ok: true }, formatOptions), '{\n  "ok": true\n}')
  assert.equal(formatDetailValue('notes', '', formatOptions), '-')
})

test('builds selfie and map URLs from attendance rows', () => {
  const row = {
    selfie_url: 'https://example.test/photo.jpg',
    latitude: -8.409518,
    longitude: 115.188919,
  }

  assert.equal(getSelfieUrl(row), 'https://example.test/photo.jpg')
  assert.equal(hasSelfie(row), true)
  assert.equal(hasSelfie({ selfie_url: 123 }), false)
  assert.equal(getMapsUrl(row), 'https://www.google.com/maps?q=-8.409518,115.188919')
  assert.equal(hasLocationCoordinates(row), true)
  assert.equal(hasLocationCoordinates({ latitude: '-8', longitude: 115 }), false)
  assert.equal(
    getMapEmbedUrl(row),
    'https://www.openstreetmap.org/export/embed.html?bbox=115.183919%2C-8.414518%2C115.193919%2C-8.404518&layer=mapnik&marker=-8.409518%2C115.188919',
  )
})

test('maps export status to badge variants', () => {
  assert.equal(getExportStatusVariant('completed'), 'default')
  assert.equal(getExportStatusVariant('failed'), 'destructive')
  assert.equal(getExportStatusVariant('expired'), 'destructive')
  assert.equal(getExportStatusVariant('pending'), 'secondary')
  assert.equal(getExportStatusVariant('processing'), 'secondary')
})

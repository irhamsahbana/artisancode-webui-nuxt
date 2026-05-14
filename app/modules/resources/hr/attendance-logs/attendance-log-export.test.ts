import assert from 'node:assert/strict'
import test from 'node:test'

const {
  buildAttendanceExportPayload,
  buildExportMenuItems,
  countCompletedExports,
  countPendingExports,
  isExportInProgress,
  shouldPollExports,
} = await import(new URL('./attendance-log-export.ts', import.meta.url).href)

const exportItems = [
  { status: 'completed' },
  { status: 'pending' },
  { status: 'processing' },
  { status: 'failed' },
  { status: 'expired' },
]

test('counts and detects attendance export statuses', () => {
  assert.equal(isExportInProgress({ status: 'pending' }), true)
  assert.equal(isExportInProgress({ status: 'processing' }), true)
  assert.equal(isExportInProgress({ status: 'completed' }), false)
  assert.equal(countCompletedExports(exportItems), 1)
  assert.equal(countPendingExports(exportItems), 2)
  assert.equal(shouldPollExports(exportItems), true)
  assert.equal(shouldPollExports([{ status: 'completed' }, { status: 'failed' }]), false)
})

test('builds export menu item state from loading flag', () => {
  assert.deepEqual(buildExportMenuItems(true, {
    queueing: 'Queueing',
    export: 'Export',
  }), [
    {
      key: 'export',
      label: 'Queueing',
      disabled: true,
    },
  ])
  assert.deepEqual(buildExportMenuItems(false, {
    queueing: 'Queueing',
    export: 'Export',
  }), [
    {
      key: 'export',
      label: 'Export',
      disabled: false,
    },
  ])
})

test('builds attendance export payload with active filters only', () => {
  assert.deepEqual(buildAttendanceExportPayload({
    date_from: '2026-05-01',
    date_to: '',
    type: 'check_in',
    source: '',
    employee_id: 'emp-1',
    status: '',
    selfie_status: '',
    org_unit_id: '',
    branch_id: '',
    work_location_id: '',
    exception_type: '',
  }), {
    resource_type: 'attendance_logs',
    format: 'xlsx',
    date_from: '2026-05-01',
    type: 'check_in',
    employee_id: 'emp-1',
  })
})

import assert from 'node:assert/strict'
import test from 'node:test'

const {
  buildAttendanceLogStaticFilterOptions,
  mapEmployeeFilterOptions,
  mapListResponseItems,
  mapNamedFilterOptions,
  mapOrgUnitFilterOptions,
  withAnyOption,
} = await import(new URL('./attendance-log-filter-options.ts', import.meta.url).href)

const t = (key: string) => `label:${key}`

test('maps attendance log filter list responses safely', () => {
  assert.deepEqual(mapListResponseItems({
    success: true,
    message: '',
    data: {
      items: [{ id: 'emp-1' }],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        last_page: 1,
      },
    },
    errors: null,
  }), [{ id: 'emp-1' }])

  assert.deepEqual(mapListResponseItems({
    success: false,
    message: '',
    data: null,
    errors: null,
  }), [])
  assert.deepEqual(mapListResponseItems(null), [])
})

test('maps attendance log employee and named filter options', () => {
  assert.deepEqual(mapEmployeeFilterOptions([
    { id: 'emp-1', employee_no: 'EMP001', full_name: 'Ayu Lestari' },
  ]), [
    { value: 'emp-1', label: 'Ayu Lestari (EMP001)' },
  ])

  assert.deepEqual(mapNamedFilterOptions([
    { id: 'branch-1', name: 'Denpasar' },
  ]), [
    { value: 'branch-1', label: 'Denpasar' },
  ])
})

test('maps attendance log org units with localized category labels', () => {
  assert.deepEqual(mapOrgUnitFilterOptions([
    { id: 'ou-1', name: 'Engineering', category: 'department' },
    { id: 'ou-2', name: 'Uncategorized', category: '' },
    { id: 'ou-3', name: 'Custom Unit', category: 'custom' },
  ], t), [
    { value: 'ou-1', label: 'Engineering (label:ui.department)' },
    { value: 'ou-2', label: 'Uncategorized' },
    { value: 'ou-3', label: 'Custom Unit (label:ui.organizationUnit)' },
  ])
})

test('builds attendance log static filter options with any entries', () => {
  assert.deepEqual(withAnyOption('All', [
    { value: 'one', label: 'One' },
  ]), [
    { value: '', label: 'All' },
    { value: 'one', label: 'One' },
  ])

  const options = buildAttendanceLogStaticFilterOptions(t)
  assert.deepEqual(options.typeOptions, [
    { value: '', label: 'label:ui.allTypes' },
    { value: 'check_in', label: 'label:ui.checkIn' },
    { value: 'check_out', label: 'label:ui.checkOut' },
  ])
  assert.deepEqual(options.sourceOptions, [
    { value: '', label: 'label:ui.allSources' },
    { value: 'mobile', label: 'label:ui.mobile' },
    { value: 'web', label: 'label:ui.web' },
  ])
  assert.equal(options.statusOptions[0].label, 'label:ui.allStatuses')
  assert.equal(options.selfieOptions[1].value, 'with_photo')
  assert.equal(options.exceptionOptions[3].value, 'missing_check_in')
})

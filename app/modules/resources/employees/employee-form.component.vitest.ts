import { describe, expect, it } from 'vitest'
import {
  buildEmployeePayload,
  createEmptyEmployeeForm,
  syncEmployeeForm,
} from './employee-form'

describe('employee-form', () => {
  it('creates an empty employee form', () => {
    expect(createEmptyEmployeeForm()).toEqual({
      id: '',
      employee_no: '',
      full_name: '',
      email: '',
      password: '',
      org_unit_id: '',
      job_position_id: '',
      location_id: '',
      shift_id: '',
      status: 'active',
      join_date: '',
    })
  })

  it('builds a normalized employee payload and omits blank optional fields', () => {
    const form = createEmptyEmployeeForm()
    form.employee_no = '  EMP001  '
    form.full_name = '  Jane Doe  '
    form.email = '  jane@example.com  '
    form.password = '   '
    form.shift_id = 'shift-1'

    expect(buildEmployeePayload(form, 'Asia/Makassar')).toEqual({
      employee_no: 'EMP001',
      full_name: 'Jane Doe',
      email: 'jane@example.com',
      shift_id: 'shift-1',
      status: 'active',
      join_date_timezone: 'Asia/Makassar',
    })

    form.password = '  secret123  '
    form.org_unit_id = 'ou-1'
    form.job_position_id = 'jp-1'
    form.location_id = 'wl-1'
    form.join_date = '2026-05-01'

    expect(buildEmployeePayload(form, 'Asia/Makassar')).toEqual({
      employee_no: 'EMP001',
      full_name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'secret123',
      org_unit_id: 'ou-1',
      job_position_id: 'jp-1',
      location_id: 'wl-1',
      shift_id: 'shift-1',
      status: 'active',
      join_date: '2026-05-01',
      join_date_timezone: 'Asia/Makassar',
    })
  })

  it('syncs employee detail into the form', () => {
    const form = createEmptyEmployeeForm()
    syncEmployeeForm(form, {
      id: 'emp-1',
      employee_no: 'EMP001',
      full_name: 'Jane Doe',
      email: 'jane@example.com',
      org_unit_id: 'ou-1',
      job_position_id: 'jp-1',
      location_id: 'wl-1',
      shift_id: 'shift-1',
      status: 'inactive',
      join_date: '2026-05-01T00:00:00Z',
    }, () => '2026-05-01')

    expect(form).toEqual({
      id: 'emp-1',
      employee_no: 'EMP001',
      full_name: 'Jane Doe',
      email: 'jane@example.com',
      password: '',
      org_unit_id: 'ou-1',
      job_position_id: 'jp-1',
      location_id: 'wl-1',
      shift_id: 'shift-1',
      status: 'inactive',
      join_date: '2026-05-01',
    })
  })
})

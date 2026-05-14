export type EmployeeFormState = {
  id: string
  employee_no: string
  full_name: string
  email: string
  password: string
  org_unit_id: string
  job_position_id: string
  location_id: string
  shift_id: string
  status: string
  join_date: string
}

export type EmployeeDetail = {
  id?: unknown
  employee_no?: unknown
  full_name?: unknown
  email?: unknown
  org_unit_id?: unknown
  job_position_id?: unknown
  location_id?: unknown
  shift_id?: unknown
  status?: unknown
  join_date?: unknown
}

export const createEmptyEmployeeForm = (): EmployeeFormState => ({
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

export const buildEmployeePayload = (
  form: EmployeeFormState,
  browserTimezone: string,
) => {
  const payload: Record<string, unknown> = {
    employee_no: form.employee_no.trim(),
    full_name: form.full_name.trim(),
    email: form.email.trim(),
    status: form.status,
    join_date_timezone: browserTimezone,
  }

  const password = form.password.trim()
  if (password.length > 0) {
    payload.password = password
  }
  if (form.org_unit_id) {
    payload.org_unit_id = form.org_unit_id
  }
  if (form.job_position_id) {
    payload.job_position_id = form.job_position_id
  }
  if (form.location_id) {
    payload.location_id = form.location_id
  }
  if (form.shift_id) {
    payload.shift_id = form.shift_id
  }
  if (form.join_date) {
    payload.join_date = form.join_date
  }

  return payload
}

export const syncEmployeeForm = (
  form: EmployeeFormState,
  detail: EmployeeDetail,
  normalizeJoinDateForInput: (value: unknown) => string,
) => {
  form.id = String(detail.id ?? '')
  form.employee_no = String(detail.employee_no ?? '')
  form.full_name = String(detail.full_name ?? '')
  form.email = String(detail.email ?? '')
  form.password = ''
  form.org_unit_id = detail.org_unit_id == null ? '' : String(detail.org_unit_id)
  form.job_position_id = detail.job_position_id == null ? '' : String(detail.job_position_id)
  form.location_id = detail.location_id == null ? '' : String(detail.location_id)
  form.shift_id = detail.shift_id == null ? '' : String(detail.shift_id)
  form.status = String(detail.status ?? 'active')
  form.join_date = normalizeJoinDateForInput(detail.join_date)
}

export type SelectOption = {
  value: string
  label: string
}

export type AttendanceLogFilters = {
  date_from: string
  date_to: string
  type: string
  source: string
  employee_id: string
  status: string
  selfie_status: string
  org_unit_id: string
  branch_id: string
  work_location_id: string
  exception_type: string
}

export type AttendanceLogRow = Record<string, unknown>

export type EmployeeFilterItem = {
  id: string
  employee_no: string
  full_name: string
}

export type OrgUnitFilterItem = {
  id: string
  name: string
  category: string
}

export type BranchFilterItem = {
  id: string
  name: string
}

export type WorkLocationFilterItem = {
  id: string
  name: string
}

export type DatePreset = 'today' | 'yesterday' | 'this_week' | 'this_month'

export type ExportJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired'
export type ExportJobFormat = 'xlsx'

export type ExportJob = {
  id: string
  resource_type: string
  resource_label: string
  format: ExportJobFormat
  status: ExportJobStatus
  requested_by_name: string
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  expires_at: string | null
  created_at: string
  download_url: string | null
}

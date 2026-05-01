import type { ApiResponse, ListResponse } from '~/types/api'
import type {
  BranchFilterItem,
  EmployeeFilterItem,
  OrgUnitFilterItem,
  SelectOption,
  WorkLocationFilterItem,
} from './types'

export const orgUnitCategoryLabelKeys: Record<string, string> = {
  branch: 'ui.branch',
  company: 'layout.companies',
  department: 'ui.department',
  division: 'ui.division',
  team: 'ui.team',
}

export const mapListResponseItems = <T extends Record<string, unknown>>(
  response: ApiResponse<ListResponse<T>> | ApiResponse<{ items: T[] }> | null | undefined,
) => {
  const items = response?.data && 'items' in response.data ? response.data.items : []
  return items
}

export const withAnyOption = (label: string, options: SelectOption[]) => [
  { value: '', label },
  ...options,
]

export const mapEmployeeFilterOptions = (items: EmployeeFilterItem[]) => (
  items.map(item => ({
    value: item.id,
    label: `${item.full_name} (${item.employee_no})`,
  }))
)

export const mapNamedFilterOptions = (
  items: Array<BranchFilterItem | WorkLocationFilterItem>,
) => (
  items.map(item => ({
    value: item.id,
    label: item.name,
  }))
)

export const mapOrgUnitFilterOptions = (
  items: OrgUnitFilterItem[],
  t: (key: string) => string,
) => (
  items.map(item => ({
    value: item.id,
    label: item.category
      ? `${item.name} (${t(orgUnitCategoryLabelKeys[item.category] ?? 'ui.organizationUnit')})`
      : item.name,
  }))
)

export const buildAttendanceLogStaticFilterOptions = (t: (key: string) => string) => ({
  typeOptions: withAnyOption(t('ui.allTypes'), [
    { value: 'check_in', label: t('ui.checkIn') },
    { value: 'check_out', label: t('ui.checkOut') },
  ]),
  sourceOptions: withAnyOption(t('ui.allSources'), [
    { value: 'mobile', label: t('ui.mobile') },
    { value: 'web', label: t('ui.web') },
  ]),
  statusOptions: withAnyOption(t('ui.allStatuses'), [
    { value: 'recorded', label: t('ui.recorded') },
  ]),
  selfieOptions: withAnyOption(t('ui.allPhotoStates'), [
    { value: 'with_photo', label: t('ui.withPhoto') },
    { value: 'without_photo', label: t('ui.withoutPhoto') },
  ]),
  exceptionOptions: withAnyOption(t('ui.allExceptions'), [
    { value: 'late_check_in', label: t('ui.lateCheckIn') },
    { value: 'missing_check_out', label: t('ui.missingCheckOut2') },
    { value: 'missing_check_in', label: t('ui.missingCheckIn2') },
  ]),
})

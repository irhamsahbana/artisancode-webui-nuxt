import { computed, ref } from 'vue'
import type { ListResponse } from '~/types/api'
import type { ApiFetch } from '../roles/types'
import {
  buildAttendanceLogStaticFilterOptions,
  mapEmployeeFilterOptions,
  mapListResponseItems,
  mapNamedFilterOptions,
  mapOrgUnitFilterOptions,
  withAnyOption,
} from './attendance-log-filter-options'
import type {
  BranchFilterItem,
  EmployeeFilterItem,
  OrgUnitFilterItem,
  WorkLocationFilterItem,
} from './types'

type UseAttendanceLogFilterOptionsOptions = {
  apiFetch: ApiFetch
  t: (key: string) => string
}

export const useAttendanceLogFilterOptions = ({
  apiFetch,
  t,
}: UseAttendanceLogFilterOptionsOptions) => {
  const employeeItems = ref<EmployeeFilterItem[]>([])
  const orgUnitItems = ref<OrgUnitFilterItem[]>([])
  const branchItems = ref<BranchFilterItem[]>([])
  const workLocationItems = ref<WorkLocationFilterItem[]>([])

  const staticOptions = computed(() => buildAttendanceLogStaticFilterOptions(t))
  const employeeOptions = computed(() => withAnyOption(
    t('ui.allEmployees'),
    mapEmployeeFilterOptions(employeeItems.value),
  ))
  const orgUnitOptions = computed(() => withAnyOption(
    t('ui.allOrgUnits'),
    mapOrgUnitFilterOptions(orgUnitItems.value, t),
  ))
  const branchOptions = computed(() => withAnyOption(
    t('ui.allBranches'),
    mapNamedFilterOptions(branchItems.value),
  ))
  const workLocationOptions = computed(() => withAnyOption(
    t('ui.allWorkLocations'),
    mapNamedFilterOptions(workLocationItems.value),
  ))

  const load = async () => {
    const [employeeResponse, orgUnitResponse, branchResponse, workLocationResponse] = await Promise.all([
      apiFetch<ListResponse<EmployeeFilterItem>>('/employees', {
        query: { limit: 200 },
      }),
      apiFetch<ListResponse<OrgUnitFilterItem>>('/org-units', {
        query: { limit: 300 },
      }),
      apiFetch<ListResponse<BranchFilterItem>>('/org-units', {
        query: { category: 'branch', limit: 200 },
      }),
      apiFetch<ListResponse<WorkLocationFilterItem>>('/work-locations', {
        query: { limit: 200 },
      }),
    ])

    employeeItems.value = mapListResponseItems(employeeResponse)
    orgUnitItems.value = mapListResponseItems(orgUnitResponse)
    branchItems.value = mapListResponseItems(branchResponse)
    workLocationItems.value = mapListResponseItems(workLocationResponse)
  }

  return {
    typeOptions: computed(() => staticOptions.value.typeOptions),
    sourceOptions: computed(() => staticOptions.value.sourceOptions),
    statusOptions: computed(() => staticOptions.value.statusOptions),
    selfieOptions: computed(() => staticOptions.value.selfieOptions),
    exceptionOptions: computed(() => staticOptions.value.exceptionOptions),
    employeeOptions,
    orgUnitOptions,
    branchOptions,
    workLocationOptions,
    load,
  }
}

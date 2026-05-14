import { ref } from 'vue'
import { useApi } from '~/composables/useApi'
import type { OrgUnitOption } from './org-unit-form-config'

type OrgUnitListItem = {
  id?: string
  name?: string
}

type OrgUnitListResponse = {
  items?: OrgUnitListItem[]
}

export function useOrgUnitParentOptions() {
  const { apiFetch } = useApi()
  const parentOptions = ref<OrgUnitOption[]>([])

  const fetchParentOptions = async (options?: { excludeId?: string }) => {
    try {
      const response = await apiFetch<OrgUnitListResponse>('/org-units?limit=1000')

      if (!response.success || !response.data?.items) {
        parentOptions.value = []
        return
      }

      parentOptions.value = response.data.items
        .filter(item => item.id && item.name && item.id !== options?.excludeId)
        .map(item => ({
          value: item.id as string,
          label: item.name as string,
        }))
    }
    catch (error) {
      parentOptions.value = []
      throw error
    }
  }

  return {
    fetchParentOptions,
    parentOptions,
  }
}

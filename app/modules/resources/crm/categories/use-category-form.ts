import { computed, ref } from 'vue'
import type { CrmCategoryGroup } from './crm-category-groups'
import {
  getCrmCategoryEndpoint,
  getCrmCategorySupportsParent,
} from './crm-category-groups'
import {
  createCategoryPayload,
  createCategoryStatusOptions,
  createEmptyCategoryForm,
  isCategoryStatus,
  type CategoryFormState,
} from './category-form'

type ParentCategoryListItem = {
  id?: string | number | null
  name?: string | null
  parent_id?: string | number | null
}

type ParentCategoryOption = {
  id: string
  name: string
  parent_id: string | null
}

export type CategoryFormDeps = {
  apiFetch: ReturnType<typeof useApi>['apiFetch']
  t: ReturnType<typeof useLocale>['t']
}

export const useCategoryForm = (
  categoryGroup: CrmCategoryGroup,
  deps: CategoryFormDeps,
) => {
  const endpoint = getCrmCategoryEndpoint(categoryGroup)
  const supportsParent = getCrmCategorySupportsParent(categoryGroup)

  const editId = ref('')
  const form = ref<CategoryFormState>(createEmptyCategoryForm())
  const parentOptions = ref<ParentCategoryOption[]>([])

  const statusOptions = computed(() => createCategoryStatusOptions(deps.t))
  const parentDisplayValue = computed(() => {
    if (!form.value.parentId) {
      return ''
    }

    const parts: string[] = []
    let current = parentOptions.value.find(item => item.id === form.value.parentId)

    while (current) {
      parts.unshift(current.name)
      current = current.parent_id
        ? parentOptions.value.find(item => item.id === current?.parent_id)
        : undefined
    }

    return parts.join(' › ')
  })

  const resetForm = () => {
    editId.value = ''
    form.value = createEmptyCategoryForm()
  }

  const loadParentOptions = async (excludeId?: string) => {
    if (!supportsParent) {
      parentOptions.value = []
      return
    }

    const response = await deps.apiFetch<{ items?: ParentCategoryListItem[] }>(endpoint, {
      query: {
        limit: 200,
        paginate: 200,
      },
    })

    if (!response.success || !response.data) {
      parentOptions.value = []
      return
    }

    parentOptions.value = (response.data.items ?? [])
      .filter(item => item.id != null)
      .map(item => {
        const label = String(item.name ?? '').trim()
        const parentId = item.parent_id == null ? null : String(item.parent_id)

        return {
          id: String(item.id),
          name: label,
          parent_id: parentId,
        }
      })
      .filter(item => item.name.length > 0)
      .filter(item => item.id !== excludeId)
  }

  const populateFromRow = (row: Record<string, unknown>) => {
    form.value.parentId = typeof row.parent_id === 'string' ? row.parent_id : ''
    form.value.name = typeof row.name === 'string' ? row.name : ''

    const status = typeof row.status === 'string' ? row.status : ''
    form.value.status = isCategoryStatus(status) ? status : 'active'
  }

  const buildPayload = () => {
    if (!supportsParent) {
      form.value.parentId = ''
    }

    return createCategoryPayload(form.value)
  }

  return {
    editId,
    form,
    parentOptions,
    parentDisplayValue,
    statusOptions,
    supportsParent,
    endpoint,
    resetForm,
    loadParentOptions,
    populateFromRow,
    buildPayload,
  }
}

import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from '#app'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'
import {
  createOrgUnitFormState,
  isOrgUnitCategory,
  orgUnitCategoryOptions,
  type OrgUnitDetail,
} from './org-unit-form-config'
import { useOrgUnitParentOptions } from './use-org-unit-parent-options'

export function useOrgUnitDetailPage() {
  const route = useRoute()
  const router = useRouter()
  const { apiFetch } = useApi()
  const { show } = useBanner()
  const { t } = useLocale()
  const localePath = useLocalePath()

  const orgUnitId = computed(() => String(route.params.id))
  const { fetchParentOptions, parentOptions } = useOrgUnitParentOptions()
  const loading = ref(false)
  const saveLoading = ref(false)
  const editForm = reactive(createOrgUnitFormState())

  const fetchOrgUnit = async () => {
    loading.value = true

    try {
      const response = await apiFetch<OrgUnitDetail>(`/org-units/${orgUnitId.value}`)

      if (!response.success || !response.data) {
        return
      }

      editForm.name = response.data.name ?? ''
      editForm.category = response.data.category && isOrgUnitCategory(response.data.category)
        ? response.data.category
        : 'company'
      editForm.parent_id = response.data.parent_id ?? ''
    }
    finally {
      loading.value = false
    }
  }

  const goBack = async () => {
    await router.push(localePath('/app/resources/org-units'))
  }

  const saveChanges = async () => {
    const name = editForm.name.trim()

    if (!name) {
      show(t('ui.nameIsRequired'), 'error')
      return
    }

    const payload: Record<string, unknown> = {
      name,
      category: editForm.category,
      parent_id: editForm.parent_id || null,
    }

    saveLoading.value = true

    try {
      const response = await apiFetch(`/org-units/${orgUnitId.value}`, {
        method: 'PUT',
        body: payload,
      })

      if (response.success) {
        show(t('ui.orgUnitUpdated'), 'success')
      }
    }
    finally {
      saveLoading.value = false
    }
  }

  onMounted(() => {
    void fetchParentOptions({ excludeId: orgUnitId.value })
    void fetchOrgUnit()
  })

  return {
    categoryOptionList: orgUnitCategoryOptions,
    editForm,
    fetchOrgUnit,
    fetchParentOptions,
    goBack,
    loading,
    parentOptions,
    saveChanges,
    saveLoading,
  }
}

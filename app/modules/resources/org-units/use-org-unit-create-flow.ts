import { reactive, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'
import { createOrgUnitFormState } from './org-unit-form-config'

type UseOrgUnitCreateFlowOptions = {
  onCreated?: () => Promise<void> | void
  refreshParentOptions?: () => Promise<void> | void
}

export function useOrgUnitCreateFlow(options: UseOrgUnitCreateFlowOptions = {}) {
  const { apiFetch } = useApi()
  const { show } = useBanner()
  const { t } = useLocale()

  const createLoading = ref(false)
  const createOpen = ref(false)
  const createForm = reactive(createOrgUnitFormState())

  const resetCreateForm = () => {
    Object.assign(createForm, createOrgUnitFormState())
  }

  const openCreate = () => {
    resetCreateForm()
    createOpen.value = true
  }

  const closeCreate = () => {
    createOpen.value = false
  }

  const submitCreate = async () => {
    const name = createForm.name.trim()

    if (!name) {
      show(t('ui.nameIsRequired'), 'error')
      return false
    }

    createLoading.value = true

    try {
      const response = await apiFetch('/org-units', {
        method: 'POST',
        body: {
          name,
          category: createForm.category,
          parent_id: createForm.parent_id || null,
        },
      })

      if (!response.success) {
        return false
      }

      show(t('ui.orgUnitCreated'), 'success')
      closeCreate()
      await options.onCreated?.()
      await options.refreshParentOptions?.()

      return true
    }
    finally {
      createLoading.value = false
    }
  }

  return {
    closeCreate,
    createForm,
    createLoading,
    createOpen,
    openCreate,
    resetCreateForm,
    submitCreate,
  }
}

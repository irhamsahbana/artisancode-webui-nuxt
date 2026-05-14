import { ref } from 'vue'
import type { CrmCategoryGroup } from './crm-category-groups'
import { useCategoryForm, type CategoryFormDeps } from './use-category-form'

export type CategoriesDialogDeps = CategoryFormDeps & {
  showBanner: (message: string, type: 'success' | 'error') => void
}

export const useCategoriesDialog = (
  categoryGroup: CrmCategoryGroup,
  deps: CategoriesDialogDeps,
  options?: { onSaved?: () => void },
) => {
  const {
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
  } = useCategoryForm(categoryGroup, deps)

  const modalOpen = ref(false)
  const modalMode = ref<'create' | 'edit'>('create')
  const modalLoading = ref(false)
  const submitLoading = ref(false)

  const openCreateModal = async () => {
    resetForm()
    modalMode.value = 'create'
    modalOpen.value = true

    if (!supportsParent) {
      return
    }

    modalLoading.value = true
    try {
      await loadParentOptions()
    }
    finally {
      modalLoading.value = false
    }
  }

  const openEditModal = async (row: Record<string, unknown>) => {
    const id = row.id ?? row.uuid ?? row.code
    if (id === undefined || id === null) {
      deps.showBanner(deps.t('ui.editFailedMissingId'), 'error')
      return
    }

    resetForm()
    editId.value = String(id)
    modalMode.value = 'edit'
    modalOpen.value = true
    populateFromRow(row)

    if (!supportsParent) {
      return
    }

    modalLoading.value = true
    try {
      await loadParentOptions(editId.value)
    }
    finally {
      modalLoading.value = false
    }
  }

  const closeModal = () => {
    modalOpen.value = false
    modalLoading.value = false
    submitLoading.value = false
    resetForm()
  }

  const handleSubmit = async () => {
    const payload = buildPayload()
    if (!payload) {
      deps.showBanner(deps.t('ui.nameIsRequired'), 'error')
      return
    }

    submitLoading.value = true

    try {
      if (modalMode.value === 'create') {
        const response = await deps.apiFetch(endpoint, {
          method: 'POST',
          body: payload,
        })

        if (response.success) {
          deps.showBanner(deps.t('ui.categoryCreatedSuccessfully'), 'success')
          closeModal()
          options?.onSaved?.()
        }

        return
      }

      const response = await deps.apiFetch(`/categories/${editId.value}`, {
        method: 'PUT',
        body: payload,
      })

      if (response.success) {
        deps.showBanner(deps.t('ui.categoryUpdatedSuccessfully'), 'success')
        closeModal()
        options?.onSaved?.()
      }
    }
    finally {
      submitLoading.value = false
    }
  }

  return {
    supportsParent,
    modalOpen,
    modalMode,
    modalLoading,
    submitLoading,
    form,
    parentOptions,
    parentDisplayValue,
    statusOptions,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSubmit,
  }
}

import { ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'

type JobPositionForm = {
  id: string
  name: string
  grade: string
}

const createEmptyForm = (): JobPositionForm => ({
  id: '',
  name: '',
  grade: '',
})

export const useJobPositionDialog = (options?: {
  onSaved?: () => void
}) => {
  const { apiFetch } = useApi()
  const { show } = useBanner()
  const { t } = useLocale()

  const modalOpen = ref(false)
  const modalMode = ref<'create' | 'edit'>('create')
  const modalLoading = ref(false)
  const submitLoading = ref(false)
  const form = ref<JobPositionForm>(createEmptyForm())

  const resetForm = () => {
    form.value = createEmptyForm()
  }

  const openCreateModal = () => {
    resetForm()
    modalMode.value = 'create'
    modalOpen.value = true
  }

  const openEditModal = async (row: Record<string, unknown>) => {
    resetForm()
    modalMode.value = 'edit'
    modalOpen.value = true
    modalLoading.value = true

    try {
      const id = row.id as string
      const resp = await apiFetch<Record<string, unknown>>(`/job-positions/${id}`)
      if (resp.success && resp.data) {
        const data = resp.data
        form.value.id = String(data.id ?? '')
        form.value.name = String(data.name ?? '')
        form.value.grade = data.grade == null ? '' : String(data.grade)
      }
    }
    finally {
      modalLoading.value = false
    }
  }

  const closeModal = () => {
    modalOpen.value = false
    resetForm()
  }

  const buildPayload = () => {
    const payload: Record<string, unknown> = {
      name: form.value.name.trim(),
    }
    if (form.value.grade.trim()) {
      payload.grade = form.value.grade.trim()
    }
    return payload
  }

  const handleSubmit = async () => {
    if (!form.value.name.trim()) {
      show(t('ui.nameIsRequired'), 'error')
      return
    }

    submitLoading.value = true

    try {
      if (modalMode.value === 'create') {
        const resp = await apiFetch('/job-positions', {
          method: 'POST',
          body: buildPayload(),
        })
        if (resp.success) {
          show(t('ui.jobPositionCreatedSuccessfully'), 'success')
          closeModal()
          options?.onSaved?.()
        }
        return
      }

      const resp = await apiFetch(`/job-positions/${form.value.id}`, {
        method: 'PUT',
        body: buildPayload(),
      })
      if (resp.success) {
        show(t('ui.jobPositionUpdatedSuccessfully'), 'success')
        closeModal()
        options?.onSaved?.()
      }
    }
    finally {
      submitLoading.value = false
    }
  }

  return {
    modalOpen,
    modalMode,
    modalLoading,
    submitLoading,
    form,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSubmit,
  }
}

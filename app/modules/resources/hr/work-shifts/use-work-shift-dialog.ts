import { computed, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'
import { getTimezoneLabel, getTimezoneOptions } from '~/utils/timezone-options'

type WorkShiftDialogMode = 'create' | 'edit'

type WorkShiftFormState = {
  id: string
  name: string
  timezone: string
  start_time: string
  end_time: string
  grace_period_minutes: string
}

const createEmptyForm = (): WorkShiftFormState => ({
  id: '',
  name: '',
  timezone: 'Asia/Makassar',
  start_time: '',
  end_time: '',
  grace_period_minutes: '0',
})

const buildPayload = (form: WorkShiftFormState) => ({
  name: form.name.trim(),
  timezone: form.timezone.trim(),
  start_time: form.start_time,
  end_time: form.end_time,
  grace_period_minutes: Number.parseInt(form.grace_period_minutes, 10) || 0,
})

export const useWorkShiftDialog = () => {
  const { apiFetch } = useApi()
  const { show } = useBanner()
  const { locale, t } = useLocale()

  const timezoneOptions = computed(() => getTimezoneOptions(locale.value))
  const columns = [
    { key: 'name', label: 'Name' },
    {
      key: 'timezone',
      label: 'Timezone',
      format: (value: unknown) => getTimezoneLabel(locale.value, typeof value === 'string' ? value : null),
    },
    { key: 'start_time', label: 'Start Time' },
    { key: 'end_time', label: 'End Time' },
    {
      key: 'grace_period_minutes',
      label: 'Grace Period',
      format: (value: unknown) => `${Number(value ?? 0)} min`,
    },
  ]

  const modalOpen = ref(false)
  const modalMode = ref<WorkShiftDialogMode>('create')
  const modalLoading = ref(false)
  const submitLoading = ref(false)
  const refreshKey = ref(0)
  const form = ref<WorkShiftFormState>(createEmptyForm())

  const deleteLabelFormatter = (row: Record<string, unknown>) => {
    const name = row.name
    if (typeof name === 'string' && name.length > 0) {
      return name
    }
    return String(row.id ?? '-')
  }

  const resetForm = () => {
    form.value = createEmptyForm()
  }

  const triggerRefresh = () => {
    refreshKey.value += 1
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
      const id = String(row.id ?? '')
      const response = await apiFetch<Record<string, unknown>>(`/work-shifts/${id}`)

      if (!response.success || !response.data) {
        return
      }

      const data = response.data
      form.value.id = String(data.id ?? '')
      form.value.name = String(data.name ?? '')
      form.value.timezone = String(data.timezone ?? 'Asia/Makassar')
      form.value.start_time = String(data.start_time ?? '')
      form.value.end_time = String(data.end_time ?? '')
      form.value.grace_period_minutes = String(data.grace_period_minutes ?? '0')
    }
    finally {
      modalLoading.value = false
    }
  }

  const closeModal = () => {
    modalOpen.value = false
    resetForm()
  }

  const handleSubmit = async () => {
    if (!form.value.name.trim()) {
      show(t('ui.nameIsRequired'), 'error')
      return
    }
    if (!form.value.timezone.trim()) {
      show(t('ui.timezoneIsRequired'), 'error')
      return
    }
    if (!form.value.start_time) {
      show(t('ui.startTimeIsRequired'), 'error')
      return
    }
    if (!form.value.end_time) {
      show(t('ui.endTimeIsRequired'), 'error')
      return
    }

    submitLoading.value = true

    try {
      if (modalMode.value === 'create') {
        const response = await apiFetch('/work-shifts', {
          method: 'POST',
          body: buildPayload(form.value),
        })

        if (response.success) {
          show(t('ui.workShiftCreatedSuccessfully'), 'success')
          closeModal()
          triggerRefresh()
        }

        return
      }

      const response = await apiFetch(`/work-shifts/${form.value.id}`, {
        method: 'PUT',
        body: buildPayload(form.value),
      })

      if (response.success) {
        show(t('ui.workShiftUpdatedSuccessfully'), 'success')
        closeModal()
        triggerRefresh()
      }
    }
    finally {
      submitLoading.value = false
    }
  }

  return {
    columns,
    timezoneOptions,
    deleteLabelFormatter,
    modalOpen,
    modalMode,
    modalLoading,
    submitLoading,
    form,
    refreshKey,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSubmit,
  }
}

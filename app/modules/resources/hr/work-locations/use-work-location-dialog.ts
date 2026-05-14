import { ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'

type WorkLocationForm = {
  id: string
  name: string
  org_unit_id: string | null
  address: string
  latitude: string
  longitude: string
  radius_meters: string
}

const createEmptyForm = (): WorkLocationForm => ({
  id: '',
  name: '',
  org_unit_id: null,
  address: '',
  latitude: '',
  longitude: '',
  radius_meters: '',
})

const normalizeOptionalText = (value: string) => {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

const normalizeOptionalNumber = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export const useWorkLocationDialog = (options?: {
  onSaved?: () => void
}) => {
  const { apiFetch } = useApi()
  const { show } = useBanner()
  const { t, format } = useLocale()

  const modalOpen = ref(false)
  const modalMode = ref<'create' | 'edit'>('create')
  const modalLoading = ref(false)
  const submitLoading = ref(false)
  const form = ref<WorkLocationForm>(createEmptyForm())

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
      const id = String(row.id ?? '')
      const resp = await apiFetch<Record<string, unknown>>(`/work-locations/${id}`)
      if (resp.success && resp.data) {
        const data = resp.data
        form.value.id = String(data.id ?? '')
        form.value.name = String(data.name ?? '')
        form.value.org_unit_id = data.org_unit_id ? String(data.org_unit_id) : null
        form.value.address = data.address ? String(data.address) : ''
        form.value.latitude = data.latitude != null ? String(data.latitude) : ''
        form.value.longitude = data.longitude != null ? String(data.longitude) : ''
        form.value.radius_meters = data.radius_meters != null ? String(data.radius_meters) : ''
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

  const buildPayload = () => ({
    name: form.value.name.trim(),
    org_unit_id: form.value.org_unit_id || null,
    address: normalizeOptionalText(form.value.address),
    latitude: normalizeOptionalNumber(form.value.latitude),
    longitude: normalizeOptionalNumber(form.value.longitude),
    radius_meters: normalizeOptionalNumber(form.value.radius_meters),
  })

  const handleSubmit = async () => {
    if (!form.value.name.trim()) {
      show(format('common.requiredField', { field: t('common.name') }), 'error')
      return
    }

    submitLoading.value = true

    try {
      if (modalMode.value === 'create') {
        const resp = await apiFetch('/work-locations', {
          method: 'POST',
          body: buildPayload(),
        })
        if (resp.success) {
          show(t('company.workLocationCreated'), 'success')
          closeModal()
          options?.onSaved?.()
        }
        return
      }

      const resp = await apiFetch(`/work-locations/${form.value.id}`, {
        method: 'PUT',
        body: buildPayload(),
      })
      if (resp.success) {
        show(t('company.workLocationUpdated'), 'success')
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

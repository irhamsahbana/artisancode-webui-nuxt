<script setup lang="ts">
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'

defineOptions({ name: 'WorkLocationsPage' })

const { apiFetch } = useApi()
const { show } = useBanner()
const { t, format } = useLocale()

// --- List config ---
const deleteLabelFormatter = (row: Record<string, unknown>) => {
  const name = row.name
  if (typeof name === 'string' && name.length > 0) {
    return name
  }
  return String(row.id ?? '-')
}

const columns = [
  { key: 'name', label: t('common.name') },
  { key: 'org_unit_name', label: t('company.organizationUnit') },
  { key: 'timezone', label: t('company.timezone') },
  { key: 'address', label: t('company.address') },
]

// --- Modal state ---
const modalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const modalLoading = ref(false)

const form = ref({
  id: '',
  name: '',
  org_unit_id: null as string | null,
  address: '',
  timezone: 'Asia/Jakarta',
  latitude: '',
  longitude: '',
  radius_meters: '',
})

const resetForm = () => {
  form.value = {
    id: '',
    name: '',
    org_unit_id: null,
    address: '',
    timezone: 'Asia/Jakarta',
    latitude: '',
    longitude: '',
    radius_meters: '',
  }
}

// --- Refresh trigger for ResourceList ---
const refreshKey = ref(0)
const triggerRefresh = () => {
  refreshKey.value++
}

// --- Open modal ---
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

  const id = row.id as string
  const resp = await apiFetch<Record<string, unknown>>(`/work-locations/${id}`)
  if (resp.success && resp.data) {
    const d = resp.data
    form.value.id = String(d.id ?? '')
    form.value.name = String(d.name ?? '')
    form.value.org_unit_id = d.org_unit_id ? String(d.org_unit_id) : null
    form.value.address = d.address ? String(d.address) : ''
    form.value.timezone = String(d.timezone ?? 'Asia/Jakarta')
    form.value.latitude = d.latitude != null ? String(d.latitude) : ''
    form.value.longitude = d.longitude != null ? String(d.longitude) : ''
    form.value.radius_meters = d.radius_meters != null ? String(d.radius_meters) : ''
  }
  modalLoading.value = false
}

const closeModal = () => {
  modalOpen.value = false
  resetForm()
}

// --- Submit ---
const submitLoading = ref(false)

const buildPayload = () => ({
  name: form.value.name,
  org_unit_id: form.value.org_unit_id || null,
  address: form.value.address || null,
  timezone: form.value.timezone,
  latitude: form.value.latitude ? parseFloat(form.value.latitude) : null,
  longitude: form.value.longitude ? parseFloat(form.value.longitude) : null,
  radius_meters: form.value.radius_meters ? parseInt(form.value.radius_meters, 10) : null,
})

const handleSubmit = async () => {
  if (!form.value.name.trim()) {
    show(format('common.requiredField', { field: t('common.name') }), 'error')
    return
  }
  if (!form.value.timezone.trim()) {
    show(format('common.requiredField', { field: t('company.timezone') }), 'error')
    return
  }

  submitLoading.value = true

  if (modalMode.value === 'create') {
    const resp = await apiFetch('/work-locations', {
      method: 'POST',
      body: buildPayload(),
    })
    if (resp.success) {
      show(t('company.workLocationCreated'), 'success')
      closeModal()
      triggerRefresh()
    }
  } else {
    const resp = await apiFetch(`/work-locations/${form.value.id}`, {
      method: 'PUT',
      body: buildPayload(),
    })
    if (resp.success) {
      show(t('company.workLocationUpdated'), 'success')
      closeModal()
      triggerRefresh()
    }
  }

  submitLoading.value = false
}
</script>

<template>
  <!-- The :key forces full re-mount so useAsyncData re-runs -->
  <ResourceList
    :key="refreshKey"
    :title="t('company.workLocations')"
    endpoint="/work-locations"
    :columns="columns"
    loading-variant="skeleton"
    :delete-label-formatter="deleteLabelFormatter"
    :can-view-detail="false"
  >
    <template #header-actions>
      <Button
        size="sm"
        @click="openCreateModal"
      >
        + {{ t('company.addWorkLocation') }}
      </Button>
    </template>

    <template #row-actions="{ row, close }">
      <button
        class="w-full rounded px-3 py-2 text-left hover:bg-accent"
        @click="close(); openEditModal(row)"
      >
        {{ t('common.edit') }}
      </button>
    </template>

    <template #cell:org_unit_name="{ item }">
      <span v-if="item.org_unit_name">
        {{ item.org_unit_name }}
      </span>
      <span
        v-else
        class="text-muted-foreground"
      >-</span>
    </template>
    <template #cell:address="{ item }">
      <span v-if="item.address">
        {{ item.address }}
      </span>
      <span
        v-else
        class="text-muted-foreground"
      >-</span>
    </template>
  </ResourceList>

  <!-- Create / Edit Modal -->
  <div
    v-if="modalOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
    @click.self="closeModal"
  >
    <div class="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="text-lg font-semibold">
          {{ modalMode === 'create' ? t('company.addWorkLocation') : t('company.editWorkLocation') }}
        </div>
        <Button
          variant="outline"
          size="sm"
          @click="closeModal"
        >
          ✕
        </Button>
      </div>

      <div
        v-if="modalLoading"
        class="mt-6 text-sm text-muted-foreground"
      >
        {{ t('common.loading') }}
      </div>

      <form
        v-else
        class="mt-4 space-y-4"
        @submit.prevent="handleSubmit"
      >
        <!-- Name -->
        <div>
          <Label for="wl-name">{{ t('common.name') }} *</Label>
          <Input
            id="wl-name"
            v-model="form.name"
            placeholder="e.g. Kantor Pusat Jakarta"
            class="mt-1"
          />
        </div>

        <!-- Org Unit -->
        <div>
          <Label>{{ t('company.organizationUnit') }}</Label>
          <OrgUnitTreeSelect
            v-model="form.org_unit_id"
            :placeholder="t('company.selectOrganizationUnit')"
            class="mt-1"
          />
        </div>

        <!-- Timezone -->
        <div>
          <Label for="wl-timezone">{{ t('company.timezone') }} *</Label>
          <Input
            id="wl-timezone"
            v-model="form.timezone"
            placeholder="e.g. Asia/Jakarta"
            class="mt-1"
          />
        </div>

        <!-- Radius -->
        <div>
          <Label for="wl-radius">{{ t('company.radiusMeters') }}</Label>
          <Input
            id="wl-radius"
            v-model="form.radius_meters"
            type="number"
            placeholder="e.g. 200"
            class="mt-1"
          />
        </div>

        <!-- Map Location Picker -->
        <div>
          <Label>{{ t('company.locationAndAddress') }}</Label>
          <LocationMapPicker
            :latitude="form.latitude ? parseFloat(form.latitude) : null"
            :longitude="form.longitude ? parseFloat(form.longitude) : null"
            :address="form.address || null"
            :radius-meters="form.radius_meters ? parseInt(form.radius_meters, 10) : null"
            class="mt-1"
            @update:latitude="form.latitude = $event != null ? String($event) : ''"
            @update:longitude="form.longitude = $event != null ? String($event) : ''"
            @update:address="form.address = $event ?? ''"
            @update:radius-meters="form.radius_meters = $event != null ? String($event) : ''"
          />
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="submitLoading"
            @click="closeModal"
          >
            {{ t('common.cancel') }}
          </Button>
          <Button
            size="sm"
            :disabled="submitLoading"
            type="submit"
          >
            {{ submitLoading ? t('common.saving') : (modalMode === 'create' ? t('common.create') : t('common.update')) }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

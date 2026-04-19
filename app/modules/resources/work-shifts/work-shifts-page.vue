<script setup lang="ts">
import { computed, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'
import { getTimezoneLabel, getTimezoneOptions } from '~/utils/timezone-options'
import { localizeUiText } from '~/utils/ui-localization'

defineOptions({ name: 'WorkShiftsPage' })

const { apiFetch } = useApi()
const { show } = useBanner()
const { locale } = useLocale()
const uiText = (value: string) => localizeUiText(locale.value, value)

const timezoneOptions = computed(() => getTimezoneOptions(locale.value))

// --- List config ---
const deleteLabelFormatter = (row: Record<string, unknown>) => {
  const name = row.name
  if (typeof name === 'string' && name.length > 0) {
    return name
  }
  return String(row.id ?? '-')
}

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
    format: (value: unknown) => {
      const mins = Number(value ?? 0)
      return `${mins} min`
    },
  },
]

// --- Modal state ---
const modalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const modalLoading = ref(false)
const submitLoading = ref(false)

const form = ref({
  id: '',
  name: '',
  timezone: 'Asia/Makassar',
  start_time: '',
  end_time: '',
  grace_period_minutes: '0',
})

const resetForm = () => {
  form.value = {
    id: '',
    name: '',
    timezone: 'Asia/Makassar',
    start_time: '',
    end_time: '',
    grace_period_minutes: '0',
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
  const resp = await apiFetch<Record<string, unknown>>(`/work-shifts/${id}`)
  if (resp.success && resp.data) {
    const d = resp.data
    form.value.id = String(d.id ?? '')
    form.value.name = String(d.name ?? '')
    form.value.timezone = String(d.timezone ?? 'Asia/Makassar')
    form.value.start_time = String(d.start_time ?? '')
    form.value.end_time = String(d.end_time ?? '')
    form.value.grace_period_minutes = String(d.grace_period_minutes ?? '0')
  }
  modalLoading.value = false
}

const closeModal = () => {
  modalOpen.value = false
  resetForm()
}

// --- Submit ---
const buildPayload = () => ({
  name: form.value.name.trim(),
  timezone: form.value.timezone.trim(),
  start_time: form.value.start_time,
  end_time: form.value.end_time,
  grace_period_minutes: parseInt(form.value.grace_period_minutes, 10) || 0,
})

const handleSubmit = async () => {
  if (!form.value.name.trim()) {
    show(uiText('Name is required'), 'error')
    return
  }
  if (!form.value.timezone.trim()) {
    show(uiText('Timezone is required'), 'error')
    return
  }
  if (!form.value.start_time) {
    show(uiText('Start time is required'), 'error')
    return
  }
  if (!form.value.end_time) {
    show(uiText('End time is required'), 'error')
    return
  }

  submitLoading.value = true

  if (modalMode.value === 'create') {
    const resp = await apiFetch('/work-shifts', {
      method: 'POST',
      body: buildPayload(),
    })
    if (resp.success) {
      show(uiText('Work shift created successfully'), 'success')
      closeModal()
      triggerRefresh()
    }
  } else {
    const resp = await apiFetch(`/work-shifts/${form.value.id}`, {
      method: 'PUT',
      body: buildPayload(),
    })
    if (resp.success) {
      show(uiText('Work shift updated successfully'), 'success')
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
    title="Work Shifts"
    endpoint="/work-shifts"
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
        + {{ uiText('Add Work Shift') }}
      </Button>
    </template>

    <template #row-actions="{ row, close }">
      <button
        class="w-full rounded px-3 py-2 text-left hover:bg-accent"
        @click="close(); openEditModal(row)"
      >
        {{ uiText('Edit') }}
      </button>
    </template>
  </ResourceList>

  <!-- Create / Edit Modal -->
  <div
    v-if="modalOpen"
  >
    <FormDialogShell
      max-width-class="max-w-lg"
      :title="modalMode === 'create' ? uiText('Add Work Shift') : uiText('Edit Work Shift')"
      :description="uiText('Organize shift timing and grace settings with a cleaner form layout.')"
      @close="closeModal"
    >
      <div
        v-if="modalLoading"
        class="text-sm text-muted-foreground"
      >
        {{ uiText('Loading...') }}
      </div>

      <form
        v-else
        class="space-y-4"
        @submit.prevent="handleSubmit"
      >
        <!-- Name -->
        <div>
          <Label for="ws-name">Name *</Label>
          <Input
            id="ws-name"
            v-model="form.name"
            placeholder="e.g. Morning Shift"
            class="mt-1"
          />
        </div>

        <!-- Timezone -->
        <div>
          <Label for="ws-timezone">Timezone *</Label>
          <SearchableSelect
            id="ws-timezone"
            v-model="form.timezone"
            :options="timezoneOptions"
            :placeholder="uiText('Select timezone')"
            :search-placeholder="uiText('Search timezone')"
            class="mt-1"
          />
          <p class="mt-1 text-xs text-muted-foreground">
            {{ uiText('Use friendly timezone labels such as WIB, WITA, or WIT.') }}
          </p>
        </div>

        <!-- Start Time -->
        <div>
          <Label for="ws-start">Start Time *</Label>
          <Input
            id="ws-start"
            v-model="form.start_time"
            type="time"
            placeholder="08:00"
            class="mt-1"
          />
        </div>

        <!-- End Time -->
        <div>
          <Label for="ws-end">End Time *</Label>
          <Input
            id="ws-end"
            v-model="form.end_time"
            type="time"
            placeholder="17:00"
            class="mt-1"
          />
        </div>

        <!-- Grace Period -->
        <div>
          <Label for="ws-grace">Grace Period (minutes) *</Label>
          <Input
            id="ws-grace"
            v-model="form.grace_period_minutes"
            type="number"
            placeholder="0"
            min="0"
            class="mt-1"
          />
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            class="rounded-xl"
            :disabled="submitLoading"
            @click="closeModal"
          >
            {{ uiText('Cancel') }}
          </Button>
          <Button
            size="sm"
            class="rounded-xl"
            :disabled="submitLoading"
            type="submit"
          >
            {{ submitLoading ? uiText('Saving...') : (modalMode === 'create' ? uiText('Create') : uiText('Update')) }}
          </Button>
        </div>
      </form>
    </FormDialogShell>
  </div>
</template>

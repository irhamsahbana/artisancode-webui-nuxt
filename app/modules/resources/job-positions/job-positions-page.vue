<script setup lang="ts">
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'

defineOptions({ name: 'JobPositionsPage' })

const { apiFetch } = useApi()
const { show } = useBanner()
const { locale, text: uiText } = useLocale()

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
    key: 'grade',
    label: 'Grade',
    format: (value: unknown) => (value == null ? '-' : String(value)),
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
  grade: '',
})

const resetForm = () => {
  form.value = { id: '', name: '', grade: '' }
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
  const resp = await apiFetch<Record<string, unknown>>(`/job-positions/${id}`)
  if (resp.success && resp.data) {
    const d = resp.data
    form.value.id = String(d.id ?? '')
    form.value.name = String(d.name ?? '')
    form.value.grade = d.grade == null ? '' : String(d.grade)
  }
  modalLoading.value = false
}

const closeModal = () => {
  modalOpen.value = false
  resetForm()
}

// --- Submit ---
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
    show(uiText('Name is required'), 'error')
    return
  }

  submitLoading.value = true

  if (modalMode.value === 'create') {
    const resp = await apiFetch('/job-positions', {
      method: 'POST',
      body: buildPayload(),
    })
    if (resp.success) {
      show(uiText('Job position created successfully'), 'success')
      closeModal()
      triggerRefresh()
    }
  } else {
    const resp = await apiFetch(`/job-positions/${form.value.id}`, {
      method: 'PUT',
      body: buildPayload(),
    })
    if (resp.success) {
      show(uiText('Job position updated successfully'), 'success')
      closeModal()
      triggerRefresh()
    }
  }

  submitLoading.value = false
}
</script>

<template>
  <ResourceList
    :key="refreshKey"
    title="Job Positions"
    endpoint="/job-positions"
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
        {{ uiText('Add New') }}
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
      :title="modalMode === 'create' ? uiText('Add Job Position') : uiText('Edit Job Position')"
      :description="uiText('Define role naming and grade structure with a cleaner form layout.')"
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
          <Label for="jp-name">Name *</Label>
          <Input
            id="jp-name"
            v-model="form.name"
            placeholder="e.g. Software Engineer"
            class="mt-1"
          />
        </div>

        <!-- Grade -->
        <div>
          <Label for="jp-grade">Grade</Label>
          <Input
            id="jp-grade"
            v-model="form.grade"
            placeholder="e.g. A1"
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

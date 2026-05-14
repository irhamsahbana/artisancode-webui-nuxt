<script setup lang="ts">
import { ref } from 'vue'
import { useJobPositionDialog } from './use-job-position-dialog'

defineOptions({ name: 'JobPositionsPage' })

const { t } = useLocale()

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

// --- Refresh trigger for ResourceList ---
const refreshKey = ref(0)
const triggerRefresh = () => {
  refreshKey.value++
}

const {
  modalOpen,
  modalMode,
  modalLoading,
  submitLoading,
  form,
  openCreateModal,
  openEditModal,
  closeModal,
  handleSubmit,
} = useJobPositionDialog({
  onSaved: triggerRefresh,
})
</script>

<template>
  <ResourceList
    :key="refreshKey"
    :title="t('layout.jobPositions')"
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
        {{ t('ui.addNew') }}
      </Button>
    </template>

    <template #row-actions="{ row, close }">
      <button
        class="w-full rounded px-3 py-2 text-left hover:bg-accent"
        @click="close(); openEditModal(row)"
      >
        {{ t('ui.edit') }}
      </button>
    </template>
  </ResourceList>

  <!-- Create / Edit Modal -->
  <div
    v-if="modalOpen"
  >
    <FormDialogShell
      max-width-class="max-w-lg"
      :title="modalMode === 'create' ? t('ui.addJobPosition') : t('ui.editJobPosition')"
      :description="t('ui.defineRoleNamingAndGradeStructureWithACleanerFormLayout')"
      @close="closeModal"
    >
      <div
        v-if="modalLoading"
        class="text-sm text-muted-foreground"
      >
        {{ t('ui.loading2') }}
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
            {{ t('ui.cancel') }}
          </Button>
          <Button
            size="sm"
            class="rounded-xl"
            :disabled="submitLoading"
            type="submit"
          >
            {{ submitLoading ? t('ui.saving') : (modalMode === 'create' ? t('ui.create') : t('ui.update')) }}
          </Button>
        </div>
      </form>
    </FormDialogShell>
  </div>
</template>

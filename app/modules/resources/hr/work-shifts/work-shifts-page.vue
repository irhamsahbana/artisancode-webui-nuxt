<script setup lang="ts">
import { useWorkShiftDialog } from './use-work-shift-dialog'

defineOptions({ name: 'WorkShiftsPage' })

const { t } = useLocale()
const {
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
} = useWorkShiftDialog()
</script>

<template>
  <!-- The :key forces full re-mount so useAsyncData re-runs -->
  <ResourceList
    :key="refreshKey"
    :title="t('ui.workShifts')"
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
      :title="modalMode === 'create' ? t('ui.addWorkShift') : t('ui.editWorkShift')"
      :description="t('ui.organizeShiftTimingAndGraceSettingsWithACleanerFormLayout')"
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
            :placeholder="t('ui.selectTimezone')"
            :search-placeholder="t('ui.searchTimezone')"
            class="mt-1"
          />
          <p class="mt-1 text-xs text-muted-foreground">
            {{ t('ui.useFriendlyTimezoneLabelsSuchAsWibWitaOrWit') }}
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

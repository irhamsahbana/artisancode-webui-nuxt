<script setup lang="ts">
import { ref } from 'vue'
import { useWorkLocationDialog } from './use-work-location-dialog'

defineOptions({ name: 'WorkLocationsPage' })

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
  { key: 'name', label: t('common.name') },
  { key: 'org_unit_name', label: t('company.organizationUnit') },
  { key: 'address', label: t('company.address') },
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
} = useWorkLocationDialog({
  onSaved: () => {
    triggerRefresh()
  },
})
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
        {{ t('common.addNew') }}
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
  >
    <FormDialogShell
      max-width-class="max-w-lg"
      :title="modalMode === 'create' ? t('company.addWorkLocation') : t('company.editWorkLocation')"
      :description="t('ui.setWorkLocationIdentityAndMapCoverageInOneFlow')"
      @close="closeModal"
    >
      <div
        v-if="modalLoading"
        class="text-sm text-muted-foreground"
      >
        {{ t('common.loading') }}
      </div>

      <form
        v-else
        class="space-y-4"
        @submit.prevent="handleSubmit"
      >
        <!-- Name -->
        <div>
          <Label for="wl-name">{{ t('common.name') }} *</Label>
          <Input
            id="wl-name"
            v-model="form.name"
            :placeholder="t('common.name')"
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
            class="rounded-xl"
            :disabled="submitLoading"
            @click="closeModal"
          >
            {{ t('common.cancel') }}
          </Button>
          <Button
            size="sm"
            class="rounded-xl"
            :disabled="submitLoading"
            type="submit"
          >
            {{ submitLoading ? t('common.saving') : (modalMode === 'create' ? t('common.create') : t('common.update')) }}
          </Button>
        </div>
      </form>
    </FormDialogShell>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import OrgUnitDetailForm from './org-unit-detail-form.vue'
import { isOrgUnitCategory, orgUnitCategoryOptions } from './org-unit-form-config'
import { useOrgUnitCreateFlow } from './use-org-unit-create-flow'
import { useOrgUnitParentOptions } from './use-org-unit-parent-options'

defineOptions({ name: 'OrgUnitsPage' })
const { t } = useLocale()

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'parent_id', label: 'Parent ID' },
]

const listKey = ref(0)
const { fetchParentOptions, parentOptions } = useOrgUnitParentOptions()
const refreshList = async () => {
  listKey.value += 1
}

onMounted(() => {
  void fetchParentOptions()
})

const {
  closeCreate,
  createForm,
  createLoading,
  createOpen,
  openCreate,
  submitCreate,
} = useOrgUnitCreateFlow({
  onCreated: refreshList,
  refreshParentOptions: fetchParentOptions,
})

const deleteLabelFormatter = (row: Record<string, unknown>) => {
  const name = row.name
  if (typeof name === 'string' && name.length > 0) {
    return name
  }
  return String(row.id ?? '-')
}

const handleCreateSubmit = async () => {
  await submitCreate()
}

const handleCreateCategoryUpdate = (value: string) => {
  if (isOrgUnitCategory(value)) {
    createForm.category = value
  }
}
</script>

<template>
  <ResourceList
    :key="listKey"
    :title="t('ui.organizationUnits')"
    endpoint="/org-units"
    :columns="columns"
    loading-variant="skeleton"
    :delete-label-formatter="deleteLabelFormatter"
  >
    <!-- Header Actions (Create Button) -->
    <template #header-actions>
      <Button
        size="sm"
        @click="openCreate"
      >
        {{ t('ui.addNew') }}
      </Button>
    </template>
  </ResourceList>

  <FormDialogShell
    v-if="createOpen"
    max-width-class="max-w-xl"
    :title="t('ui.createOrganizationUnit')"
    @close="closeCreate"
  >
    <form
      class="space-y-6"
      @submit.prevent="handleCreateSubmit"
    >
      <OrgUnitDetailForm
        :name="createForm.name"
        :category="createForm.category"
        :parent-id="createForm.parent_id"
        :category-options="orgUnitCategoryOptions"
        :parent-options="parentOptions"
        @update:name="createForm.name = $event"
        @update:category="handleCreateCategoryUpdate"
        @update:parent-id="createForm.parent_id = $event"
      />
      <button
        type="submit"
        class="hidden"
      />
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="createLoading"
          @click="closeCreate"
        >
          {{ t('ui.cancel') }}
        </Button>
        <Button
          size="sm"
          :disabled="createLoading"
          @click="handleCreateSubmit"
        >
          {{ createLoading ? t('ui.creating') : t('ui.create') }}
        </Button>
      </div>
    </template>
  </FormDialogShell>
</template>

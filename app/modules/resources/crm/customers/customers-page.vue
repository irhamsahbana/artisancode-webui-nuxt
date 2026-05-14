<script setup lang="ts">
import CustomerManageDialog from './customer-manage-dialog.vue'
import { useCustomersPage } from './use-customers-page'

defineOptions({ name: 'CustomersPage' })

const { t } = useLocale()
const {
  areaSelectOptions,
  closeModal,
  columns,
  createCompanyNameOption,
  customerStatusOptions,
  customerTypeSelectOptions,
  deleteLabelFormatter,
  entityTypeOptions,
  fetchCompanyNameOptions,
  form,
  handleSubmit,
  levelOptions,
  modalLoading,
  modalMode,
  modalOpen,
  openCreateModal,
  openEditModal,
  refreshKey,
  relationshipStatusSelectOptions,
  segmentSelectOptions,
  submitLoading,
} = useCustomersPage()
</script>

<template>
  <ResourceList
    :key="refreshKey"
    :title="t('ui.customers')"
    endpoint="/customers"
    :columns="columns"
    loading-variant="skeleton"
    :can-view-detail="false"
    :delete-label-formatter="deleteLabelFormatter"
  >
    <template #header-actions>
      <Button
        size="sm"
        class="rounded-xl"
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

  <CustomerManageDialog
    v-model:form="form"
    :open="modalOpen"
    :mode="modalMode"
    :loading="modalLoading"
    :saving="submitLoading"
    :entity-type-options="entityTypeOptions"
    :customer-type-options="customerTypeSelectOptions"
    :segment-options="segmentSelectOptions"
    :area-options="areaSelectOptions"
    :customer-status-options="customerStatusOptions"
    :level-options="levelOptions"
    :relationship-status-options="relationshipStatusSelectOptions"
    :fetch-company-name-options="fetchCompanyNameOptions"
    :create-company-name-option="createCompanyNameOption"
    @close="closeModal"
    @submit="handleSubmit"
  />
</template>

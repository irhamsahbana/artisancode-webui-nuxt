<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import InternalResourceFilterPanel from '../internal-resource-filter-panel.vue'
import InternalResourceListControls from '../internal-resource-list-controls.vue'
import InternalProductManageDialog from './internal-product-manage-dialog.vue'
import { useInternalProductManager } from './use-internal-product-manager'
import { useDateTime } from '~/composables/useDateTime'

defineOptions({ name: 'InternalProductsPage' })

const { t } = useLocale()
const { formatReadableDateTime } = useDateTime()

const refreshKey = ref(0)
const filterPanelOpen = ref(false)
const actionMenuOpen = ref(false)
const filters = reactive({
  status: '',
})

const listQuery = computed(() => {
  const query: Record<string, string> = {}
  if (filters.status) {
    query.status = filters.status
  }
  return query
})
const actionItems = computed(() => [
  {
    key: 'export-products',
    label: 'ui.export',
    kind: 'export' as const,
  },
  {
    key: 'product-export-history',
    label: 'ui.exportHistory',
    kind: 'export-history' as const,
  },
])

const triggerRefresh = () => {
  refreshKey.value += 1
}

const manager = useInternalProductManager(triggerRefresh)
const {
  closeDialog,
  deletePrice,
  deletePricing,
  deletingPriceId,
  deletingPricingId,
  dialogLoading,
  dialogMode,
  dialogOpen,
  hasSavedProduct,
  openCreateDialog,
  priceEditorMode,
  priceForm,
  priceSaving,
  prices,
  pricesLoading,
  pricingEditorMode,
  pricingForm,
  pricingSaving,
  pricings,
  pricingsLoading,
  productForm,
  productSaving,
  selectPrice,
  selectPricing,
  selectedPriceId,
  selectedPricing,
  selectedPricingId,
  startCreatePrice,
  startCreatePricing,
  startEditPricing,
  statusOptionList,
  submitPrice,
  submitPricing,
  submitProduct,
} = manager

const columns = computed(() => [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  {
    key: 'updated_at',
    label: 'Updated At',
    format: (value: unknown) => {
      if (typeof value !== 'string' || !value) {
        return '-'
      }

      return formatReadableDateTime(value, undefined, '-')
    },
  },
])

const deleteLabelFormatter = (row: Record<string, unknown>) => {
  const name = row.name
  const code = row.code

  if (typeof name === 'string' && name.length > 0 && typeof code === 'string' && code.length > 0) {
    return `${name} (${code})`
  }

  return typeof name === 'string' && name.length > 0 ? name : String(row.id ?? '-')
}

const openEditModal = async (row: Record<string, unknown>) => {
  const id = String(row.id ?? '')
  if (!id) {
    return
  }

  await manager.openEditDialog(id)
}

const clearFilters = () => {
  filters.status = ''
}

const toggleFilterPanel = () => {
  filterPanelOpen.value = !filterPanelOpen.value
  if (filterPanelOpen.value) {
    actionMenuOpen.value = false
  }
}

const updateActionMenuOpen = (open: boolean) => {
  actionMenuOpen.value = open
  if (open) {
    filterPanelOpen.value = false
  }
}
</script>

<template>
  <ResourceList
    :key="refreshKey"
    :title="t('ui.products')"
    endpoint="/internal-products"
    :columns="columns"
    :extra-query="listQuery"
    loading-variant="skeleton"
    :search-placeholder="t('ui.searchProducts')"
    :show-search-filter-trigger="true"
    :search-filter-open="filterPanelOpen"
    :can-view-detail="false"
    auth-mode="internal"
    :delete-label-formatter="deleteLabelFormatter"
    @search-filter-trigger="toggleFilterPanel"
  >
    <template #filters>
      <InternalResourceFilterPanel
        v-model:open="filterPanelOpen"
        @clear="clearFilters"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="internal-product-status-filter">{{ t('ui.status') }}</Label>
            <SearchableSelect
              id="internal-product-status-filter"
              v-model="filters.status"
              :options="[{ value: '', label: t('ui.allStatuses') }, ...statusOptionList]"
              :placeholder="t('ui.allStatuses')"
              :search-placeholder="t('ui.searchStatus')"
            />
          </div>
        </div>
      </InternalResourceFilterPanel>
    </template>

    <template #header-actions>
      <div class="flex w-full flex-wrap items-center justify-end gap-2">
        <Button
          size="sm"
          class="rounded-xl"
          @click="openCreateDialog()"
        >
          {{ t('ui.addNew') }}
        </Button>

        <InternalResourceListControls
          :actions-open="actionMenuOpen"
          endpoint="/internal-products"
          resource-key="internal-products"
          filename-prefix="internal-products"
          :columns="columns"
          :query="listQuery"
          :action-items="actionItems"
          @update:actions-open="updateActionMenuOpen"
        />
      </div>
    </template>

    <template #row-actions="{ row, close }">
      <button
        class="w-full rounded px-3 py-2 text-left hover:bg-accent"
        @click="close(); openEditModal(row)"
      >
        {{ t('ui.manage') }}
      </button>
    </template>
  </ResourceList>

  <InternalProductManageDialog
    v-model:product-form="productForm"
    v-model:pricing-form="pricingForm"
    v-model:price-form="priceForm"
    :open="dialogOpen"
    :mode="dialogMode"
    :loading="dialogLoading"
    :status-options="statusOptionList"
    :product-saving="productSaving"
    :has-saved-product="hasSavedProduct"
    :pricings="pricings"
    :pricings-loading="pricingsLoading"
    :pricing-saving="pricingSaving"
    :pricing-deleting-id="deletingPricingId"
    :pricing-form-mode="pricingEditorMode"
    :selected-pricing-id="selectedPricingId"
    :selected-pricing="selectedPricing"
    :prices="prices"
    :prices-loading="pricesLoading"
    :price-saving="priceSaving"
    :price-deleting-id="deletingPriceId"
    :price-form-mode="priceEditorMode"
    :selected-price-id="selectedPriceId"
    @close="closeDialog"
    @delete-price="deletePrice"
    @delete-pricing="deletePricing"
    @select-price="selectPrice"
    @select-pricing="selectPricing"
    @start-create-price="startCreatePrice"
    @start-create-pricing="startCreatePricing"
    @start-edit-pricing="startEditPricing"
    @submit-price="submitPrice"
    @submit-pricing="submitPricing"
    @submit-product="submitProduct"
  />
</template>

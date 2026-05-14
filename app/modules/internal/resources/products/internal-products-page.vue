<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import InternalResourceFilterPanel from '../internal-resource-filter-panel.vue'
import InternalProductManageDialog from './internal-product-manage-dialog.vue'
import {
  buildInternalProductListQuery,
  createInternalProductColumns,
  formatInternalProductDeleteLabel,
} from './internal-product-list'
import { useInternalProductManager } from './use-internal-product-manager'
import { useDateTime } from '~/composables/useDateTime'

defineOptions({ name: 'InternalProductsPage' })

const { t } = useLocale()
const { formatReadableDateTime } = useDateTime()

const refreshKey = ref(0)
const filterPanelOpen = ref(false)
const filters = reactive({
  status: '',
})

const listQuery = computed(() => buildInternalProductListQuery(filters))

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
  activeCurrencyOptions,
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

const columns = computed(() => createInternalProductColumns({ t, formatReadableDateTime }))

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
    :delete-label-formatter="formatInternalProductDeleteLabel"
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
    :active-currency-options="activeCurrencyOptions"
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

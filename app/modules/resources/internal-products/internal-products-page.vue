<script setup lang="ts">
import { computed, ref } from 'vue'
import InternalProductManageDialog from './internal-product-manage-dialog.vue'
import { useInternalProductManager } from './use-internal-product-manager'
import { useDateTime } from '~/composables/useDateTime'

defineOptions({ name: 'InternalProductsPage' })

const { text: uiText } = useLocale()
const { formatReadableDateTime } = useDateTime()

const refreshKey = ref(0)

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
</script>

<template>
  <ResourceList
    :key="refreshKey"
    :title="uiText('Products')"
    endpoint="/internal-products"
    :columns="columns"
    loading-variant="skeleton"
    :can-view-detail="false"
    auth-mode="internal"
    :delete-label-formatter="deleteLabelFormatter"
  >
    <template #header-actions>
      <Button
        size="sm"
        @click="openCreateDialog()"
      >
        {{ uiText('Add New') }}
      </Button>
    </template>

    <template #row-actions="{ row, close }">
      <button
        class="w-full rounded px-3 py-2 text-left hover:bg-accent"
        @click="close(); openEditModal(row)"
      >
        {{ uiText('Manage') }}
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

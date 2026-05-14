<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { useCommerceCreateForm } from './use-commerce-create-form'

defineOptions({ name: 'CommerceCreateDialog' })

const props = defineProps<{
  mode: 'quotation' | 'order'
}>()

const emit = defineEmits<{
  (event: 'created'): void
}>()

const {
  createOpen,
  createSaving,
  createTitle,
  clientLoading,
  productLoading,
  pricingLoading,
  currencyLoading,
  createForm,
  productOptions,
  pricingOptions,
  clientOptions,
  currencyOptions,
  selectedCurrencyDecimalPlaces,
  subtotalAmountInput,
  discountAmountInput,
  taxAmountInput,
  totalAmountInput,
  openCreateDialog,
  closeCreateDialog,
  submitCreate,
} = useCommerceCreateForm()

const open = () => openCreateDialog(props.mode)
const close = () => closeCreateDialog()
const submit = async () => {
  await submitCreate()
  if (!createOpen.value) {
    emit('created')
  }
}

defineExpose({ open, close })
</script>

<template>
  <FormDialogShell
    v-if="createOpen"
    :title="createTitle"
    max-width-class="max-w-3xl"
    @close="close"
  >
    <form
      class="grid gap-5"
      autocomplete="off"
      @submit.prevent="submit"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="relative z-10 grid gap-2 sm:col-span-2">
          <Label for="commerce-tenant">
            {{ $t('ui.tenant') }}
          </Label>
          <SearchableSelect
            id="commerce-tenant"
            v-model="createForm.tenantId"
            :options="clientOptions"
            :placeholder="clientLoading ? $t('ui.loadingClients') : $t('ui.selectTenant')"
            :search-placeholder="$t('ui.searchClients')"
            :disabled="clientLoading || createSaving"
            autocomplete="off"
          />
        </div>

        <div class="relative z-0 grid gap-2">
          <Label for="commerce-product">
            {{ $t('ui.product') }}
          </Label>
          <SearchableSelect
            id="commerce-product"
            v-model="createForm.internalProductId"
            :options="productOptions"
            :placeholder="productLoading ? $t('ui.loadingProducts') : $t('ui.selectProduct')"
            :search-placeholder="$t('ui.searchProduct')"
            :disabled="productLoading || createSaving"
            autocomplete="off"
          />
        </div>

        <div class="relative z-0 grid gap-2">
          <Label for="commerce-pricing">
            {{ $t('ui.pricing') }}
          </Label>
          <SearchableSelect
            id="commerce-pricing"
            v-model="createForm.internalProductPricingId"
            :options="pricingOptions"
            :placeholder="pricingLoading ? $t('ui.loadingPricings') : $t('ui.selectPricing')"
            :search-placeholder="$t('ui.searchPricing')"
            :disabled="pricingLoading || createSaving || !createForm.internalProductId"
            autocomplete="off"
          />
        </div>

        <div class="relative z-0 grid gap-2">
          <Label for="commerce-currency">
            {{ $t('ui.currency') }}
          </Label>
          <SearchableSelect
            id="commerce-currency"
            v-model="createForm.currencyCode"
            :options="currencyOptions"
            :placeholder="$t('internalProducts.prices.currencyPlaceholder')"
            :search-placeholder="$t('internalProducts.prices.currencySearchPlaceholder')"
            :disabled="createSaving"
            autocomplete="off"
          />
        </div>

        <div class="relative z-0 grid gap-2">
          <Label for="commerce-invoice-due">
            {{ $t('ui.invoiceDueAt') }}
          </Label>
          <Input
            id="commerce-invoice-due"
            v-model="createForm.invoiceDueAt"
            type="datetime-local"
            :disabled="createSaving"
            autocomplete="off"
          />
        </div>
      </div>

      <div
        v-if="mode === 'quotation'"
        class="grid gap-4 sm:grid-cols-2"
      >
        <div class="grid gap-2">
          <Label for="commerce-subtotal">
            {{ $t('ui.subtotalAmount') }}
          </Label>
          <Input
            id="commerce-subtotal"
            v-model="subtotalAmountInput"
            inputmode="decimal"
            :disabled="createSaving"
            autocomplete="off"
          />
        </div>

        <div class="grid gap-2">
          <Label for="commerce-discount">
            {{ $t('ui.discountAmount') }}
          </Label>
          <Input
            id="commerce-discount"
            v-model="discountAmountInput"
            inputmode="decimal"
            :disabled="createSaving"
            autocomplete="off"
          />
        </div>

        <div class="grid gap-2">
          <Label for="commerce-tax">
            {{ $t('ui.taxAmount') }}
          </Label>
          <Input
            id="commerce-tax"
            v-model="taxAmountInput"
            inputmode="decimal"
            :disabled="createSaving"
            autocomplete="off"
          />
        </div>

        <div class="grid gap-2">
          <Label for="commerce-total">
            {{ $t('ui.totalAmount') }}
          </Label>
          <Input
            id="commerce-total"
            v-model="totalAmountInput"
            inputmode="decimal"
            :disabled="createSaving"
            autocomplete="off"
          />
        </div>

        <div class="grid gap-2">
          <Label for="commerce-expires">
            {{ $t('ui.expiresAt') }}
          </Label>
          <Input
            id="commerce-expires"
            v-model="createForm.expiresAt"
            type="datetime-local"
            :disabled="createSaving"
            autocomplete="off"
          />
        </div>

        <div class="grid gap-2 sm:col-span-2">
          <Label for="commerce-note">
            {{ $t('ui.note') }}
          </Label>
          <textarea
            id="commerce-note"
            v-model="createForm.note"
            class="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="createSaving"
            autocomplete="off"
          />
        </div>
      </div>

      <div class="flex flex-wrap justify-end gap-2 border-t border-border/70 pt-4">
        <Button
          type="button"
          variant="outline"
          :disabled="createSaving"
          @click="close"
        >
          <X class="h-4 w-4" />
          {{ $t('ui.cancel') }}
        </Button>
        <Button
          type="submit"
          :disabled="createSaving"
        >
          {{ createSaving ? $t('ui.saving') : $t('ui.save') }}
        </Button>
      </div>
    </form>
  </FormDialogShell>
</template>

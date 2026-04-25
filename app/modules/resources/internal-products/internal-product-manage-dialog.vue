<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import InternalProductForm from './internal-product-form.vue'
import InternalProductPricingsSection from './internal-product-pricings-section.vue'
import InternalProductPricesSection from './internal-product-prices-section.vue'
import type {
  InternalProductForm as ProductForm,
  InternalProductPrice,
  InternalProductPriceForm,
  InternalProductPricing,
  InternalProductPricingForm,
} from './types'

defineOptions({ name: 'InternalProductManageDialog' })

type SectionId = 'product' | 'pricing' | 'price'

const productModel = defineModel<ProductForm>('productForm', { required: true })
const pricingModel = defineModel<InternalProductPricingForm>('pricingForm', { required: true })
const priceModel = defineModel<InternalProductPriceForm>('priceForm', { required: true })

const props = defineProps<{
  open: boolean
  mode: 'create' | 'edit'
  loading: boolean
  statusOptions: Array<{ value: string, label: string }>
  productSaving: boolean
  hasSavedProduct: boolean
  pricings: InternalProductPricing[]
  pricingsLoading: boolean
  pricingSaving: boolean
  pricingDeletingId: string
  pricingFormMode: 'create' | 'edit'
  selectedPricingId: string
  selectedPricing: InternalProductPricing | null
  prices: InternalProductPrice[]
  pricesLoading: boolean
  priceSaving: boolean
  priceDeletingId: string
  priceFormMode: 'create' | 'edit'
  selectedPriceId: string
}>()

const emit = defineEmits<{
  close: []
  deletePrice: [price: InternalProductPrice]
  deletePricing: [pricing: InternalProductPricing]
  selectPrice: [priceId: string]
  selectPricing: [pricingId: string]
  startCreatePrice: []
  startCreatePricing: []
  startEditPricing: [pricing: InternalProductPricing]
  submitPrice: []
  submitPricing: []
  submitProduct: []
}>()

const { text: uiText } = useLocale()
const currentSection = ref<SectionId>('product')

const dialogTitle = computed(() => (
  productModel.value.id
    ? uiText('Edit Product')
    : uiText('Add Product')
))

const sectionOrder: SectionId[] = ['product', 'pricing', 'price']

const sections = computed(() => [
  {
    id: 'product' as const,
    label: uiText('Product Details'),
    badge: productModel.value.id ? uiText('Saved') : '',
    disabled: false,
  },
  {
    id: 'pricing' as const,
    label: uiText('Pricings'),
    badge: productModel.value.id && productModel.value.id.length > 0 ? String(props.pricings.length) : '',
    disabled: !props.hasSavedProduct,
  },
  {
    id: 'price' as const,
    label: uiText('Prices'),
    badge: props.selectedPricing ? String(props.prices.length) : '',
    disabled: !props.selectedPricing,
  },
])

const currentSectionIndex = computed(() => sectionOrder.indexOf(currentSection.value))

const previousSection = computed(() => (
  currentSectionIndex.value > 0
    ? sections.value[currentSectionIndex.value - 1]
    : null
))

const nextSection = computed(() => (
  currentSectionIndex.value < sections.value.length - 1
    ? sections.value[currentSectionIndex.value + 1]
    : null
))

const selectSection = (sectionId: SectionId) => {
  const section = sections.value.find((item) => item.id === sectionId)
  if (!section || section.disabled) {
    return
  }

  currentSection.value = sectionId
}

watch(() => props.open, (open) => {
  if (open) {
    currentSection.value = 'product'
  }
})

watch(() => props.hasSavedProduct, (next, previous) => {
  if (!props.open || props.mode !== 'create') {
    return
  }

  if (!previous && next && currentSection.value === 'product') {
    currentSection.value = 'pricing'
  }
})
</script>

<template>
  <div v-if="open">
    <FormDialogShell
      max-width-class="max-w-6xl"
      :title="dialogTitle"
      :description="uiText('Set up product, pricing, and prices in clear steps.')"
      @close="emit('close')"
    >
      <div class="space-y-6">
        <div class="grid gap-3 lg:grid-cols-3">
          <button
            v-for="(section, index) in sections"
            :key="section.id"
            type="button"
            class="rounded-2xl border px-4 py-4 text-left transition-colors"
            :class="[
              currentSection === section.id
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border/70 bg-background/70 hover:bg-muted/20',
              section.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
            ]"
            :disabled="section.disabled"
            @click="selectSection(section.id)"
          >
            <div class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {{ uiText('Step') }} {{ index + 1 }}
            </div>
            <div class="mt-2 flex items-center justify-between gap-3">
              <div class="text-sm font-semibold sm:text-base">
                {{ section.label }}
              </div>
              <Badge
                v-if="section.badge"
                :variant="currentSection === section.id ? 'default' : 'secondary'"
              >
                {{ section.badge }}
              </Badge>
            </div>
          </button>
        </div>

        <InternalProductForm
          v-if="currentSection === 'product'"
          v-model="productModel"
          :mode="mode"
          :loading="loading"
          :saving="productSaving"
          :status-options="statusOptions"
          @submit="emit('submitProduct')"
        />

        <InternalProductPricingsSection
          v-else-if="currentSection === 'pricing'"
          v-model="pricingModel"
          :enabled="hasSavedProduct"
          :items="pricings"
          :loading="pricingsLoading"
          :saving="pricingSaving"
          :deleting-id="pricingDeletingId"
          :form-mode="pricingFormMode"
          :selected-pricing-id="selectedPricingId"
          :status-options="statusOptions"
          @delete="emit('deletePricing', $event)"
          @select="emit('selectPricing', $event)"
          @start-create="emit('startCreatePricing')"
          @start-edit="emit('startEditPricing', $event)"
          @submit="emit('submitPricing')"
        />

        <InternalProductPricesSection
          v-else
          v-model="priceModel"
          :enabled="Boolean(selectedPricing)"
          :items="prices"
          :loading="pricesLoading"
          :saving="priceSaving"
          :deleting-id="priceDeletingId"
          :form-mode="priceFormMode"
          :selected-price-id="selectedPriceId"
          :selected-pricing="selectedPricing"
          @delete="emit('deletePrice', $event)"
          @select="emit('selectPrice', $event)"
          @start-create="emit('startCreatePrice')"
          @submit="emit('submitPrice')"
        />

        <div class="flex flex-col-reverse gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex flex-wrap gap-2">
            <Button
              v-if="previousSection"
              type="button"
              variant="outline"
              class="rounded-xl"
              @click="selectSection(previousSection.id)"
            >
              {{ uiText('Back') }}
            </Button>

            <Button
              v-if="nextSection"
              type="button"
              variant="outline"
              class="rounded-xl"
              :disabled="nextSection.disabled"
              @click="selectSection(nextSection.id)"
            >
              {{ uiText('Continue') }}
            </Button>
          </div>

          <Button
            variant="outline"
            class="rounded-xl"
            @click="emit('close')"
          >
            {{ uiText('Close') }}
          </Button>
        </div>
      </div>
    </FormDialogShell>
  </div>
</template>
